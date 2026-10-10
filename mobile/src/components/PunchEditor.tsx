// PunchEditor.tsx — add or edit a clock punch (enterprise multi-timestamp support).
//
// Pure-JS (no native deps → OTA). Lets a worker add a "missed" punch or correct
// an existing one: date (calendar) + start/end time (stepper) + optional project.
// Times are treated as the punch's clock time and sent as UTC-Z so the server's
// day grouping matches exactly what the user picked. Delete available in edit mode.

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mobileApi, ApiError } from '@/lib/api';
import { CalendarPicker } from '@/components/CalendarPicker';
import { STATUS, type Palette } from '@/lib/theme';

export interface EditablePunch {
  id: string;
  version: number;
  clock_in_at: string;
  clock_out_at: string | null;
  project_id: string | null;
}
interface Project { id: string; name: string }

function todayISO(): string { return new Date().toISOString().slice(0, 10); }
const pad = (n: number) => String(n).padStart(2, '0');
function fmtTime(min: number): string {
  const h24 = Math.floor(min / 60), m = min % 60;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(m)} ${ampm}`;
}
function isoToMin(iso: string): number {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}
function toIso(date: string, min: number): string {
  return `${date}T${pad(Math.floor(min / 60))}:${pad(min % 60)}:00.000Z`;
}

function Stepper({ onPress, label, palette }: { onPress: () => void; label: string; palette: Palette }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.stepper, { borderColor: palette.border }]}>
      <Text style={[styles.stepperText, { color: palette.accent }]}>{label}</Text>
    </TouchableOpacity>
  );
}
function TimeField({ label, value, onChange, palette }: { label: string; value: number; onChange: (m: number) => void; palette: Palette }) {
  const bump = (delta: number) => onChange((value + delta + 1440) % 1440);
  return (
    <View>
      <Text style={[styles.tfLabel, { color: palette.textMuted }]}>{label}</Text>
      <View style={styles.tfControls}>
        <Stepper onPress={() => bump(-60)} label="−h" palette={palette} />
        <Stepper onPress={() => bump(-5)} label="−5" palette={palette} />
        <Text style={[styles.tfValue, { color: palette.text }]}>{fmtTime(value)}</Text>
        <Stepper onPress={() => bump(5)} label="+5" palette={palette} />
        <Stepper onPress={() => bump(60)} label="+h" palette={palette} />
      </View>
    </View>
  );
}

export function PunchEditor({
  visible, mode, punch, projects, palette, onClose, onSaved,
}: {
  visible: boolean;
  mode: 'add' | 'edit';
  punch?: EditablePunch | null;
  projects: Project[];
  palette: Palette;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation('field');
  const { t: tc } = useTranslation('common');

  const [date, setDate] = useState(todayISO());
  const [startMin, setStartMin] = useState(8 * 60);
  const [endMin, setEndMin] = useState(16 * 60 + 30);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [pickProj, setPickProj] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (mode === 'edit' && punch) {
      setDate(punch.clock_in_at.slice(0, 10));
      setStartMin(isoToMin(punch.clock_in_at));
      setEndMin(punch.clock_out_at ? isoToMin(punch.clock_out_at) : isoToMin(punch.clock_in_at) + 60);
      setProjectId(punch.project_id ?? null);
    } else {
      setDate(todayISO()); setStartMin(8 * 60); setEndMin(16 * 60 + 30); setProjectId(null);
    }
  }, [visible, mode, punch]);

  const projectName = projects.find((p) => p.id === projectId)?.name ?? t('time_hub.no_project');

  const save = async () => {
    if (endMin <= startMin) { Alert.alert('', t('punch.end_after_start')); return; }
    setBusy(true);
    try {
      if (mode === 'add') {
        await mobileApi('/time-punches', {
          method: 'POST',
          body: JSON.stringify({ clock_in_at: toIso(date, startMin), clock_out_at: toIso(date, endMin), project_id: projectId ?? undefined }),
        });
      } else if (punch) {
        await mobileApi(`/time-punches/${punch.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ clock_in_at: toIso(date, startMin), clock_out_at: toIso(date, endMin), project_id: projectId, version: punch.version }),
        });
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiError ? ((err.body as any)?.error?.message ?? err.message) : String(err);
      Alert.alert(tc('error'), msg);
    } finally { setBusy(false); }
  };

  const del = () => {
    if (!punch) return;
    Alert.alert(t('punch.delete_title'), t('punch.delete_confirm'), [
      { text: tc('cancel'), style: 'cancel' },
      { text: t('punch.delete'), style: 'destructive', onPress: async () => {
        setBusy(true);
        try { await mobileApi(`/time-punches/${punch.id}`, { method: 'DELETE' }); onSaved(); }
        catch (err) { Alert.alert(tc('error'), err instanceof Error ? err.message : String(err)); }
        finally { setBusy(false); }
      } },
    ]);
  };

  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={[styles.head, { backgroundColor: palette.headerBg, borderBottomColor: palette.border }]}>
          <Text style={styles.headTitle}>{mode === 'add' ? t('punch.add_title') : t('punch.edit_title')}</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.headCancel}>{tc('cancel')}</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={[styles.label, { color: palette.textMuted }]}>{t('date')}</Text>
          <TouchableOpacity style={[styles.select, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => setShowCal(true)}>
            <Text style={{ color: palette.text }}>{dateLabel}</Text>
            <Text style={{ fontSize: 16 }}>📅</Text>
          </TouchableOpacity>

          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <TimeField label={t('punch.start')} value={startMin} onChange={setStartMin} palette={palette} />
            <View style={{ height: 10 }} />
            <TimeField label={t('punch.end')} value={endMin} onChange={setEndMin} palette={palette} />
            <Text style={[styles.dur, { color: palette.textMuted }]}>
              {t('punch.duration', { hours: (Math.max(0, endMin - startMin) / 60).toFixed(2) })}
            </Text>
          </View>

          <Text style={[styles.label, { color: palette.textMuted }]}>{t('time_hub.project_optional')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.select, { flex: 1, backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => setPickProj(true)}>
              <Text style={{ color: projectId ? palette.text : palette.textMuted }} numberOfLines={1}>{projectName}</Text>
              <Text style={{ color: palette.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
            {projectId ? <TouchableOpacity style={[styles.clear, { borderColor: palette.border }]} onPress={() => setProjectId(null)}><Text style={{ color: palette.textMuted }}>✕</Text></TouchableOpacity> : null}
          </View>

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: palette.accent }, busy && { opacity: 0.6 }]} onPress={save} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{tc('save')}</Text>}
          </TouchableOpacity>

          {mode === 'edit' ? (
            <TouchableOpacity style={styles.delBtn} onPress={del} disabled={busy}>
              <Text style={[styles.delText, { color: STATUS.danger.fg }]}>{t('punch.delete')}</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        <CalendarPicker visible={showCal} value={date} palette={palette} onSelect={setDate} onClose={() => setShowCal(false)} />

        <Modal visible={pickProj} transparent animationType="slide" onRequestClose={() => setPickProj(false)}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setPickProj(false)}>
            <View style={[styles.sheet, { backgroundColor: palette.surface }]}>
              <Text style={[styles.sheetTitle, { color: palette.text }]}>{t('time_hub.select_project')}</Text>
              {projects.map((p) => (
                <TouchableOpacity key={p.id} style={[styles.optRow, { borderTopColor: palette.border }]} onPress={() => { setProjectId(p.id); setPickProj(false); }}>
                  <Text style={{ color: palette.text }}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 52, borderBottomWidth: 1 },
  headTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  headCancel: { color: '#cbd5e1', fontSize: 15 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 6 },
  select: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clear: { width: 46, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 16 },
  tfLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  tfControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tfValue: { fontSize: 18, fontWeight: '700', minWidth: 96, textAlign: 'center' },
  stepper: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  stepperText: { fontSize: 15, fontWeight: '700' },
  dur: { fontSize: 13, textAlign: 'right', marginTop: 10 },
  saveBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  delBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  delText: { fontSize: 15, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '60%' },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  optRow: { paddingVertical: 14, borderTopWidth: 1 },
});

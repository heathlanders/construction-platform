// CalendarPicker.tsx — pure-JS month-grid date picker (no native deps → OTA-shippable).
//
// A themed modal calendar: ‹ Month YYYY ›, weekday header, 6-week day grid, Today shortcut.
// Value + onSelect use 'YYYY-MM-DD' strings (same shape the time-entry API/UI use).
// Month + weekday labels are localized via toLocaleString(i18n.language).

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import i18n from '@/lib/i18n';
import type { Palette } from '@/lib/theme';

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseYmd(s: string | undefined): Date {
  if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function CalendarPicker({
  visible, value, onSelect, onClose, palette,
}: {
  visible: boolean;
  value?: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  palette: Palette;
}) {
  const initial = parseYmd(value);
  const [view, setView] = useState<{ y: number; m: number }>({ y: initial.getFullYear(), m: initial.getMonth() });

  // Re-anchor the visible month to the selected value each time the sheet opens.
  const [lastVisible, setLastVisible] = useState(false);
  if (visible && !lastVisible) {
    const a = parseYmd(value);
    if (a.getFullYear() !== view.y || a.getMonth() !== view.m) setView({ y: a.getFullYear(), m: a.getMonth() });
    setLastVisible(true);
  } else if (!visible && lastVisible) {
    setLastVisible(false);
  }

  const lang = i18n.language || 'en';
  const monthLabel = new Date(view.y, view.m, 1).toLocaleString(lang, { month: 'long', year: 'numeric' });
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    // 2024-01-07 is a Sunday → Sun..Sat short labels in the active locale.
    new Date(2024, 0, 7 + i).toLocaleString(lang, { weekday: 'narrow' }),
  );

  const firstDow = new Date(view.y, view.m, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const todayStr = ymd(new Date());

  // Build a 6×7 grid of cells (null = padding).
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const step = (delta: number) => {
    const m = view.m + delta;
    const y = view.y + Math.floor(m / 12);
    setView({ y, m: ((m % 12) + 12) % 12 });
  };

  const pick = (day: number) => { onSelect(ymd(new Date(view.y, view.m, day))); onClose(); };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          {/* header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step(-1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.nav, { color: palette.accent }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: palette.text }]}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => step(1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.nav, { color: palette.accent }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* weekday row */}
          <View style={styles.row}>
            {weekdays.map((w, i) => (
              <View key={i} style={styles.cell}><Text style={[styles.weekday, { color: palette.textMuted }]}>{w}</Text></View>
            ))}
          </View>

          {/* day grid */}
          {Array.from({ length: cells.length / 7 }, (_, r) => (
            <View key={r} style={styles.row}>
              {cells.slice(r * 7, r * 7 + 7).map((day, c) => {
                if (day == null) return <View key={c} style={styles.cell} />;
                const cellStr = ymd(new Date(view.y, view.m, day));
                const isSel = cellStr === value;
                const isToday = cellStr === todayStr;
                return (
                  <TouchableOpacity key={c} style={styles.cell} onPress={() => pick(day)}>
                    <View style={[
                      styles.dayWrap,
                      isSel && { backgroundColor: palette.accent },
                      !isSel && isToday && { borderWidth: 1, borderColor: palette.accent },
                    ]}>
                      <Text style={[styles.dayText, { color: isSel ? '#fff' : palette.text }]}>{day}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => { onSelect(todayStr); onClose(); }}>
              <Text style={[styles.today, { color: palette.accent }]}>{tLabel('today', lang)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.today, { color: palette.textMuted }]}>{tLabel('close', lang)}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// Tiny inline labels (avoid a namespace dependency for two words).
function tLabel(key: 'today' | 'close', lang: string): string {
  const es = lang.startsWith('es');
  if (key === 'today') return es ? 'Hoy' : 'Today';
  return es ? 'Cerrar' : 'Close';
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 360, borderRadius: 16, borderWidth: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  nav: { fontSize: 30, fontWeight: '700', paddingHorizontal: 12 },
  monthLabel: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  row: { flexDirection: 'row' },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  weekday: { fontSize: 12, fontWeight: '600' },
  dayWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 15, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 6 },
  today: { fontSize: 15, fontWeight: '600' },
});

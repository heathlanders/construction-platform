import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus, View, ActivityIndicator, Text } from 'react-native';
import { runSyncSweep } from '../lib/sync';
import { loadPrefs } from '@/lib/preferences';
import {
  CURRENT_VERSION,
  latestEntry,
  bulletsFor,
  getLastSeenVersion,
  setLastSeenVersion,
} from '@/lib/changelog';
import { WhatsNewModal } from '@/components/WhatsNewModal';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { RoleProvider, useCurrentUser } from '@/lib/user-context';
import { ThemeProvider, useTheme } from '@/lib/theme-context';
import { LoginScreen } from '@/screens/LoginScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { ProjectsScreen } from '@/screens/ProjectsScreen';
import { ProjectDetailScreen } from '@/screens/ProjectDetailScreen';
import { TimeEntryScreen } from '@/screens/TimeEntryScreen';
import { DailyReportScreen } from '@/screens/DailyReportScreen';
import PunchListScreen from '@/screens/PunchListScreen';
import { SafetyIncidentScreen } from '@/screens/SafetyIncidentScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { RfiListScreen } from '@/screens/RfiListScreen';
import { SubmittalListScreen } from '@/screens/SubmittalListScreen';
import { MilestoneListScreen } from '@/screens/MilestoneListScreen';
import { CrewListScreen } from '@/screens/CrewListScreen';
import { DocumentsScreen } from '@/screens/DocumentsScreen';
import { TradeScreen } from '@/screens/TradeScreen';
import { PermitListScreen } from '@/screens/PermitListScreen';
import { PermitDetailScreen } from '@/screens/PermitDetailScreen';
import { StructuralScreen } from '@/screens/StructuralScreen';
import { TaskListScreen } from '@/screens/TaskListScreen';
import { TaskDetailScreen } from '@/screens/TaskDetailScreen';
import { JSAScreen } from '@/screens/JSAScreen';
import { ConcreteTestsScreen } from '@/screens/ConcreteTestsScreen';
import { RoofingQaScreen } from '@/screens/RoofingQaScreen';
import { FramingCorrectionsScreen } from '@/screens/FramingCorrectionsScreen';
import { InspectionsScreen } from '@/screens/InspectionsScreen';
import { SafetyCertScreen } from '@/screens/SafetyCertScreen';
import { ClockScreen } from '@/screens/ClockScreen';
import { MyTimecardScreen } from '@/screens/MyTimecardScreen';
import { TimeHubScreen } from '@/screens/TimeHubScreen';
import { NearMeScreen } from '@/screens/NearMeScreen';
import { ConflictsScreen } from '@/screens/ConflictsScreen';
import { ConflictResolveScreen } from '@/screens/ConflictResolveScreen';
import { ConflictBadge } from '@/components/ConflictBadge';
import { PendingUploadsBadge } from '@/components/PendingUploadsBadge';
import { AssetDetail } from '@/screens/assets/AssetDetail';
import { InspectionForm } from '@/screens/assets/InspectionForm';
import { Checkout } from '@/screens/assets/Checkout';
import { FuelLog } from '@/screens/assets/FuelLog';
import { DamageReport } from '@/screens/assets/DamageReport';
import { WarrantyListScreen } from '@/screens/warranties/WarrantyListScreen';
import { ConnectionsScreen } from '@/screens/ConnectionsScreen';
import { ConnectionDetailScreen } from '@/screens/ConnectionDetailScreen';
import { WarrantyDetailScreen } from '@/screens/warranties/WarrantyDetailScreen';
import { ClaimDetailScreen } from '@/screens/warranties/ClaimDetailScreen';
import { NewClaimScreen } from '@/screens/warranties/NewClaimScreen';
// Side-effect import: initialises i18n before any screen renders (also used for the active locale).
import i18n from '../lib/i18n';

export type RootStackParamList = {
  Login: undefined;
  Projects: undefined;
  ProjectDetail: { projectId: string; projectName: string };
  TimeEntry: { projectId: string };
  DailyReport: { projectId: string };
  PunchList: { projectId: string; projectName: string };
  Safety: { projectId: string; projectName: string };
  Notifications: undefined;
  Rfis: { projectId: string; projectName: string };
  Submittals: { projectId: string; projectName: string };
  Milestones: { projectId: string; projectName: string };
  Crew: { projectId: string; projectName: string };
  Documents: { projectId: string; projectName: string };
  Trade: { projectId: string; projectName: string };
  Permits: { projectId: string; projectName: string };
  PermitDetail: { permitId: string; permitNumber: string };
  Structural: { projectId: string; projectName: string };
  Tasks: { projectId: string; projectName: string };
  TaskDetail: { taskId: string; taskTitle: string };
  Inspections: { projectId: string; projectName: string };
  JSA: { projectId: string; projectName: string };
  ConcreteTests: { pourId: string; pourLabel: string };
  RoofingQa: { systemId: string; systemLabel: string };
  FramingCorrections: { inspectionId: string; inspectionLabel: string };
  SafetyCerts: undefined;
  Clock: undefined;
  Timecard: undefined;
  TimeHub: undefined;
  NearMe: undefined;
  Conflicts: undefined;
  // One resolve screen for every conflict-capable table (see lib/conflict-registry.ts).
  ConflictResolve: { localId: string; table: string };
  // Asset management screens (Business+ tier — T-56)
  AssetDetail: { assetId: string; assetName: string };
  AssetInspection: { assetId: string; assetName: string };
  AssetCheckout: { assetId?: string };
  AssetFuelLog: { assetId: string; assetName: string };
  AssetDamageReport: { assetId: string; assetName: string };
  // Builder warranty screens (Business+ tier)
  WarrantyList: undefined;
  WarrantyDetail: { warrantyId: string; warrantyTitle: string };
  WarrantyClaim: { warrantyId: string; claimId: string; warrantyTitle: string };
  NewWarrantyClaim: { warrantyId: string };
  // Cross-tenant bridge (P-02 — OWNER/PM)
  Connections: undefined;
  ConnectionDetail: { connectionId: string; counterpartyName?: string };
  // Settings (role-aware layout + language + appearance)
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// Emoji tab icon (tint applies to the label; emoji renders as-is).
const tabIcon = (emoji: string) => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>;

// The "Home" tab hosts the full app stack: Projects → ProjectDetail → every feature/detail screen.
// All in-app navigation (quick-strip, tile grid, deep links) stays within this stack.
function HomeStackNavigator(): React.ReactElement {
  const { t } = useTranslation('common');
  const { palette } = useTheme();
  return (
    <Stack.Navigator
      initialRouteName="Projects"
      screenOptions={{
        headerStyle: { backgroundColor: palette.headerBg },
        headerTintColor: palette.headerText,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{ title: t('nav.projects'), headerBackVisible: false, headerRight: () => (<View style={{ flexDirection: 'row', alignItems: 'center' }}><PendingUploadsBadge /><ConflictBadge /></View>) }}
      />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={({ route }) => ({ title: route.params.projectName })} />
      <Stack.Screen name="TimeEntry" component={TimeEntryScreen} options={{ title: t('nav.log_time') }} />
      <Stack.Screen name="DailyReport" component={DailyReportScreen} options={{ title: t('nav.daily_report') }} />
      <Stack.Screen name="PunchList" component={PunchListScreen} options={({ route }) => ({ title: `${route.params.projectName} — ${t('nav.punch_list')}` })} />
      <Stack.Screen name="Safety" component={SafetyIncidentScreen} options={({ route }) => ({ title: `${route.params.projectName} — ${t('nav.safety')}` })} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: t('nav.notifications') }} />
      <Stack.Screen name="Rfis" component={RfiListScreen} options={({ route }) => ({ title: `${route.params.projectName} — ${t('nav.rfis')}` })} />
      <Stack.Screen name="Submittals" component={SubmittalListScreen} options={({ route }) => ({ title: `${route.params.projectName} — ${t('nav.submittals')}` })} />
      <Stack.Screen name="Milestones" component={MilestoneListScreen} options={({ route }) => ({ title: `${route.params.projectName} — ${t('nav.milestones')}` })} />
      <Stack.Screen name="Crew" component={CrewListScreen} options={({ route }) => ({ title: `${route.params.projectName} — ${t('nav.crew')}` })} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={({ route }) => ({ title: `${route.params.projectName} — ${t('nav.files')}` })} />
      <Stack.Screen name="Trade" component={TradeScreen} options={({ route }) => ({ title: `${route.params.projectName} — ${t('nav.trade')}` })} />
      <Stack.Screen name="Permits" component={PermitListScreen} options={({ route }) => ({ title: `${route.params.projectName} — ${t('nav.permits')}` })} />
      <Stack.Screen name="PermitDetail" component={PermitDetailScreen} options={({ route }) => ({ title: `${t('nav.permits')} ${route.params.permitNumber}` })} />
      <Stack.Screen name="Structural" component={StructuralScreen} options={({ route }) => ({ title: `${route.params.projectName} — ${t('nav.structural')}` })} />
      <Stack.Screen name="Tasks" component={TaskListScreen} options={({ route }) => ({ title: `${route.params.projectName} — ${t('nav.tasks')}` })} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={({ route }) => ({ title: route.params.taskTitle })} />
      <Stack.Screen name="Inspections" component={InspectionsScreen} options={({ route }) => ({ title: `${route.params.projectName} — ${t('nav.inspections')}` })} />
      <Stack.Screen name="JSA" component={JSAScreen} options={({ route }) => ({ title: `${route.params.projectName} — ${t('nav.jsa')}` })} />
      <Stack.Screen name="ConcreteTests" component={ConcreteTestsScreen} options={({ route }) => ({ title: route.params.pourLabel })} />
      <Stack.Screen name="RoofingQa" component={RoofingQaScreen} options={({ route }) => ({ title: route.params.systemLabel })} />
      <Stack.Screen name="FramingCorrections" component={FramingCorrectionsScreen} options={({ route }) => ({ title: route.params.inspectionLabel })} />
      <Stack.Screen name="SafetyCerts" component={SafetyCertScreen} options={{ title: t('nav.safety_certs') }} />
      <Stack.Screen name="Clock" component={ClockScreen} options={{ title: t('nav.clock') }} />
      <Stack.Screen name="Timecard" component={MyTimecardScreen} options={{ title: t('nav.timecard') }} />
      <Stack.Screen name="TimeHub" component={TimeHubScreen} options={{ title: t('nav.time') }} />
      <Stack.Screen name="NearMe" component={NearMeScreen} options={{ title: t('nav.map') }} />
      <Stack.Screen name="Conflicts" component={ConflictsScreen} options={{ title: t('nav.conflicts') }} />
      <Stack.Screen name="ConflictResolve" component={ConflictResolveScreen} options={{ title: t('nav.conflicts') }} />
      {/* Asset management (Business+ tier) */}
      <Stack.Screen name="AssetDetail" component={AssetDetail} options={({ route }) => ({ title: route.params.assetName })} />
      <Stack.Screen name="AssetInspection" component={InspectionForm} options={{ title: 'Pre-Use Inspection' }} />
      <Stack.Screen name="AssetCheckout" component={Checkout} options={{ title: 'Asset Checkout' }} />
      <Stack.Screen name="AssetFuelLog" component={FuelLog} options={{ title: 'Log Fuel' }} />
      <Stack.Screen name="AssetDamageReport" component={DamageReport} options={{ title: 'Damage Report' }} />
      {/* Builder warranty (Business+ tier) */}
      <Stack.Screen name="WarrantyList" component={WarrantyListScreen} options={{ title: 'Warranties' }} />
      <Stack.Screen name="WarrantyDetail" component={WarrantyDetailScreen} options={({ route }) => ({ title: route.params.warrantyTitle })} />
      <Stack.Screen name="WarrantyClaim" component={ClaimDetailScreen} options={{ title: 'Claim Detail' }} />
      <Stack.Screen name="NewWarrantyClaim" component={NewClaimScreen} options={{ title: 'New Claim' }} />
      {/* Cross-tenant bridge (P-02 — OWNER/PM) */}
      <Stack.Screen name="Connections" component={ConnectionsScreen} options={{ title: t('nav.connections') }} />
      <Stack.Screen
        name="ConnectionDetail"
        component={ConnectionDetailScreen}
        options={({ route }) => ({ title: route.params.counterpartyName ?? t('nav.connections') })}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('nav.settings') }} />
    </Stack.Navigator>
  );
}

// Industry-standard bottom tab bar: Home / Time / Alerts / Settings (all roles).
// The single Time tab (TimeHubScreen) replaces the old separate Clock + Timecard tabs —
// it adapts to tenant_settings.time_tracking_mode (clock in/out vs manual add-hours).
function MainTabs(): React.ReactElement {
  const { t } = useTranslation('common');
  const { palette } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border },
        headerStyle: { backgroundColor: palette.headerBg },
        headerTintColor: palette.headerText,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: t('nav.home'), tabBarIcon: tabIcon('🏠') }}
      />
      {/* One unified Time surface for all roles — clock in/out OR add hours + weekly timecard.
          Adapts to tenant_settings.time_tracking_mode. Replaces the old Clock + Timecard tabs. */}
      <Tab.Screen
        name="TimeTab"
        component={TimeHubScreen as React.ComponentType}
        options={{ title: t('nav.time'), headerShown: true, tabBarIcon: tabIcon('⏱️') }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={NotificationsScreen as React.ComponentType}
        options={{ title: t('nav.alerts'), headerShown: true, tabBarIcon: tabIcon('🔔') }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: t('nav.settings'), headerShown: true, tabBarIcon: tabIcon('⚙️') }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const appState = useRef(AppState.currentState);
  const { user, loading, refresh } = useCurrentUser();
  const { palette } = useTheme();
  const isAuthenticated = user !== null;
  const [whatsNew, setWhatsNew] = useState<{ version: string; bullets: string[] } | null>(null);

  // After login: show the "What's New" popup once per version, unless the user disabled it.
  useEffect(() => {
    if (!user) {
      setWhatsNew(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [prefs, lastSeen] = await Promise.all([
        loadPrefs(user.user_id),
        getLastSeenVersion(user.user_id),
      ]);
      if (cancelled || lastSeen === CURRENT_VERSION) return;
      if (prefs.hideUpdateMessages) {
        // Suppressed: mark current as seen so re-enabling only surfaces FUTURE updates.
        await setLastSeenVersion(user.user_id);
        return;
      }
      const entry = latestEntry();
      setWhatsNew({ version: entry.version, bullets: bulletsFor(entry, i18n.language) });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const dismissWhatsNew = useCallback(() => {
    if (user) void setLastSeenVersion(user.user_id);
    setWhatsNew(null);
  }, [user]);

  // Trigger sync sweep whenever app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        void runSyncSweep();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  // Periodic sync while the app is foregrounded (push pending + pull deltas).
  // OS-level background sync (app closed) needs a native module (expo-background-fetch)
  // + an EAS rebuild — tracked as deferred in Mobile_Enterprise_Plan §B2.
  useEffect(() => {
    if (!isAuthenticated) return;
    const SYNC_INTERVAL_MS = 3 * 60 * 1000; // 3 min
    const id = setInterval(() => {
      if (AppState.currentState === 'active') void runSyncSweep();
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {whatsNew ? (
        <WhatsNewModal
          visible
          version={whatsNew.version}
          bullets={whatsNew.bullets}
          onClose={dismissWhatsNew}
        />
      ) : null}
      <RootStack.Navigator
        // Remount on auth change so the tree swaps cleanly between Login and the tab app.
        key={isAuthenticated ? 'app' : 'guest'}
        screenOptions={{ headerShown: false }}
      >
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={() => { void refresh(); }} />}
          </RootStack.Screen>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export function AppNavigator() {
  return (
    <RoleProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </RoleProvider>
  );
}

/**
 * KSVL App - Zentrale Module-Registry
 * 
 * Diese Datei definiert alle Module der KSVL-App mit ihren:
 * - Routen, Komponenten, Hooks, Services
 * - Lifecycle-Status (draft, stable, frozen, deprecated)
 * - Typ (core, domain, support)
 * - Erforderliche Rollen
 */

export type ModuleLifecycle = 'draft' | 'stable' | 'frozen' | 'deprecated';
export type ModuleType = 'core' | 'domain' | 'support';

export interface AppModule {
  id: string;
  name: string;
  description: string;
  type: ModuleType;
  lifecycle: ModuleLifecycle;
  routes: string[];
  requiredRoles?: string[];
  docsPath?: string;
  components?: string[];
  hooks?: string[];
  services?: string[];
  contexts?: string[];
  edgeFunctions?: string[];
}

/**
 * Alle registrierten Module der KSVL-App
 */
export const APP_MODULES: AppModule[] = [
  // ========================================
  // CORE MODULE
  // ========================================
  {
    id: 'auth',
    name: 'Authentifizierung',
    description: 'Auth-System (Login, Session, Protected Routes)',
    type: 'core',
    lifecycle: 'stable',
    routes: ['/auth'],
    components: [
      'pages/Auth.tsx',
      'common/protected-route.tsx'
    ],
    hooks: [],
    contexts: ['auth-context.tsx'],
    docsPath: 'docs/architecture/ksvl_architecture_overview.md'
  },
  {
    id: 'users',
    name: 'Mitgliederverwaltung',
    description: 'User/Profile-Management, CRUD-Operationen für Mitglieder',
    type: 'core',
    lifecycle: 'stable',
    routes: ['/mitglieder'],
    requiredRoles: ['admin', 'vorstand'],
    components: [
      'user-management.tsx',
      'profile-view.tsx',
      'user-detail-view.tsx',
      'user-card-with-custom-fields.tsx',
      'profile/*'
    ],
    hooks: [
      'use-users.tsx',
      'use-users-data.tsx',
      'use-profile-data.tsx'
    ],
    services: ['services/user-service.ts'],
    edgeFunctions: [
      'manage-user',
      'manage-user-password',
      'reset-password-admin',
      'create-test-users',
      'create-role-users',
      'regenerate-role-users'
    ],
    docsPath: 'docs/modules/ksvl_modules_overview.md'
  },
  {
    id: 'roles',
    name: 'Rollen-System',
    description: 'Rollenverwaltung, Permissions, Role-Badge-Settings',
    type: 'core',
    lifecycle: 'stable',
    routes: [],
    components: [
      'user-role-selector.tsx',
      'role-card-grid.tsx',
      'role-system-info.tsx',
      'role-welcome-settings.tsx'
    ],
    hooks: [
      'use-role.tsx',
      'use-permissions.tsx',
      'use-role-badge-settings.tsx',
      'use-welcome-messages.tsx'
    ],
    docsPath: 'docs/modules/ksvl_modules_overview.md'
  },
  {
    id: 'settings',
    name: 'Einstellungen',
    description: 'App-Einstellungen (Theme, Design, Menü, Dashboard)',
    type: 'core',
    lifecycle: 'stable',
    routes: ['/settings'],
    requiredRoles: ['admin'],
    components: [
      'pages/Settings.tsx',
      'theme-manager.tsx',
      'menu-settings.tsx',
      'design-settings.tsx',
      'dashboard-settings.tsx',
      'ai-assistant-settings.tsx',
      'custom-fields-manager.tsx',
      'footer-menu-settings.tsx',
      'header-message-settings.tsx',
      'login-background-settings.tsx',
      'sticky-header-layout-settings.tsx',
      'consecutive-slots-settings.tsx'
    ],
    hooks: [
      'use-app-settings.tsx',
      'use-theme-settings.tsx',
      'use-dashboard-settings.tsx',
      'use-menu-settings.tsx',
      'use-footer-menu-settings.tsx',
      'use-login-background.tsx',
      'use-sticky-header-layout.tsx',
      'use-custom-fields.tsx',
      'use-consecutive-slots.tsx',
      'use-ai-assistant-settings.tsx',
      'use-ai-welcome-message.tsx',
      'use-settings-batch.tsx'
    ],
    docsPath: 'docs/modules/ksvl_modules_overview.md'
  },
  {
    id: 'navigation',
    name: 'Navigation & Routing',
    description: 'Routing-System, App-Shell, Bottom-Navigation',
    type: 'core',
    lifecycle: 'stable',
    routes: ['/'],
    components: [
      'dashboard-header.tsx',
      'common/unified-footer.tsx',
      'common/footer-drawer-content.tsx',
      'common/scroll-to-top.tsx'
    ],
    hooks: [],
    services: [],
    docsPath: 'docs/architecture/ksvl_routing_healthcheck.md'
  },

  // ========================================
  // DOMAIN MODULE
  // ========================================
  {
    id: 'slots',
    name: 'Krankalender & Slots',
    description: 'Kalender-Ansichten (Tag/Woche/Monat/Liste), Slot-Buchungen',
    type: 'domain',
    lifecycle: 'stable',
    routes: ['/kalender'],
    requiredRoles: ['admin', 'kranfuehrer', 'mitglied'],
    components: [
      'calendar-view.tsx',
      'calendar/slot-list-view.tsx',
      'slot-form-dialog.tsx',
      'month-calendar.tsx',
      'week-calendar.tsx',
      'common/slot-form.tsx'
    ],
    hooks: [
      'use-slots.tsx',
      'use-slot-design.tsx',
      'use-consecutive-slots.tsx'
    ],
    services: ['services/slot-service.ts'],
    contexts: ['slots-context.tsx'],
    docsPath: 'docs/slot-management-system.md'
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Dashboard mit Widgets, Stats, Welcome-Section',
    type: 'domain',
    lifecycle: 'stable',
    routes: ['/dashboard', '/'],
    components: [
      'dashboard.tsx',
      'dashboard-sections/*',
      'dashboard-widgets/*'
    ],
    hooks: [
      'use-dashboard-settings.tsx',
      'use-dashboard-animations.tsx',
      'use-harbor-chat-data.tsx'
    ],
    docsPath: 'docs/modules/ksvl_modules_overview.md'
  },
  {
    id: 'harbor-chat',
    name: 'Harbor Chat (Capitano)',
    description: 'KI-Assistent für Vereins- & Hafenfragen',
    type: 'domain',
    lifecycle: 'stable',
    routes: [],
    components: [
      'dashboard-widgets/harbor-chat-widget.tsx',
      'dashboard-widgets/ai-chat-mini-widget.tsx'
    ],
    hooks: [
      'use-harbor-chat-data.tsx',
      'use-ai-assistant-settings.tsx',
      'use-ai-welcome-message.tsx'
    ],
    edgeFunctions: ['harbor-chat'],
    docsPath: 'docs/modules/ksvl_modules_overview.md'
  },

  // ========================================
  // SUPPORT MODULE
  // ========================================
  {
    id: 'file-manager',
    name: 'Dateimanager',
    description: 'Dokumenten-Upload, Verwaltung, RBAC-System',
    type: 'support',
    lifecycle: 'stable',
    routes: ['/dateimanager'],
    requiredRoles: ['admin', 'vorstand', 'mitglied'],
    components: [
      'pages/FileManager.tsx',
      'file-manager/enhanced-file-manager.tsx',
      'file-manager/file-card.tsx',
      'file-manager/file-selector-dialog.tsx',
      'file-manager/file-upload-dialog.tsx',
      'file-manager/components/*',
      'common/document-upload.tsx',
      'profile/profile-documents-section.tsx',
      'user-documents-tab.tsx'
    ],
    hooks: [
      'use-file-manager.tsx',
      'use-file-permissions.tsx'
    ],
    edgeFunctions: ['migrate-storage-files'],
    docsPath: 'docs/file-manager-rbac-system.md'
  }
];

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Findet ein Modul anhand eines Route-Pfads
 * @param path - Route-Pfad (z.B. '/slots', '/profile/123')
 * @returns Das passende Modul oder undefined
 */
export function getModuleByRoute(path: string): AppModule | undefined {
  // Normalisiere den Pfad (entferne Query-Parameter und Hash)
  const normalizedPath = path.split('?')[0].split('#')[0];
  
  // Finde Modul, dessen Route am besten passt (längste Übereinstimmung)
  const matches = APP_MODULES.filter(m => 
    m.routes.some(r => normalizedPath.startsWith(r))
  );
  
  if (matches.length === 0) return undefined;
  
  // Sortiere nach Länge der Route (längste zuerst)
  return matches.sort((a, b) => {
    const aMaxLen = Math.max(...a.routes.map(r => r.length));
    const bMaxLen = Math.max(...b.routes.map(r => r.length));
    return bMaxLen - aMaxLen;
  })[0];
}

/**
 * Gibt alle Module eines bestimmten Typs zurück
 * @param type - Modul-Typ (core, domain, support)
 * @returns Array von Modulen
 */
export function getModulesByType(type: ModuleType): AppModule[] {
  return APP_MODULES.filter(m => m.type === type);
}

/**
 * Gibt alle stabilen Module zurück
 * @returns Array von Modulen mit lifecycle 'stable'
 */
export function getStableModules(): AppModule[] {
  return APP_MODULES.filter(m => m.lifecycle === 'stable');
}

/**
 * Gibt alle Module zurück, die eine bestimmte Rolle erfordern oder keine Rolle benötigen
 * @param role - Rolle (z.B. 'admin', 'kranfuehrer', 'mitglied')
 * @returns Array von Modulen
 */
export function getModulesByRole(role: string): AppModule[] {
  return APP_MODULES.filter(m => 
    !m.requiredRoles || m.requiredRoles.includes(role)
  );
}

/**
 * Gibt alle Module mit Edge Functions zurück
 * @returns Array von Modulen, die Edge Functions verwenden
 */
export function getModulesWithEdgeFunctions(): AppModule[] {
  return APP_MODULES.filter(m => m.edgeFunctions && m.edgeFunctions.length > 0);
}

/**
 * Findet ein Modul anhand seiner ID
 * @param id - Modul-ID
 * @returns Das Modul oder undefined
 */
export function getModuleById(id: string): AppModule | undefined {
  return APP_MODULES.find(m => m.id === id);
}

/**
 * Gibt Statistiken über alle Module zurück
 */
export function getModuleStats() {
  return {
    total: APP_MODULES.length,
    byType: {
      core: getModulesByType('core').length,
      domain: getModulesByType('domain').length,
      support: getModulesByType('support').length
    },
    byLifecycle: {
      draft: APP_MODULES.filter(m => m.lifecycle === 'draft').length,
      stable: APP_MODULES.filter(m => m.lifecycle === 'stable').length,
      frozen: APP_MODULES.filter(m => m.lifecycle === 'frozen').length,
      deprecated: APP_MODULES.filter(m => m.lifecycle === 'deprecated').length
    },
    withEdgeFunctions: getModulesWithEdgeFunctions().length
  };
}

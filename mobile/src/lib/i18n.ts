// Translations are inlined at build time so the app is fully functional offline.
// Safety strings (safety.json) must use professional human translation — no machine translation (A-13, P-09).
// Locale resolution order: user saved preference → device locale → 'en' fallback (T-09).

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    common: {
      sign_in: 'Sign In',
      sign_out: 'Sign Out',
      tenant_slug: 'Company ID',
      tenant_slug_placeholder: 'your-company',
      email: 'Email',
      password: 'Password',
      loading: 'Loading...',
      error: 'An error occurred',
      save: 'Save',
      cancel: 'Cancel',
      back: 'Back',
      retry: 'Retry',
      offline_banner: 'You are offline. Changes will sync when reconnected.',
      update_status: 'Set Status',
      update_failed: 'Update failed',
      version_conflict: 'This changed on the server. Showing the latest.',
      status_read_only: 'Only Owner, PM, or Foreman can change status.',
      saved_offline: 'No connection — saved. It will sync when you reconnect.',
      assets: {
        offline_checkout_blocked: 'Offline — you can log fuel, an inspection or damage now. Check-out needs a connection (certification is verified on the server).',
      },
      nav: {
        projects: 'Projects',
        pending_uploads: '{{count}} waiting to upload — tap to retry',
        uploads_failed_title: "{{count}} didn't upload",
        uploads_failed_body: 'These were captured on your device but the server rejected them or they ran out of retries. Retry now, or discard them.',
        uploads_retry: 'Retry',
        uploads_discard: 'Discard',
        directions: 'Directions',
        log_time: 'Log Time',
        daily_report: 'Daily Report',
        punch_list: 'Punch List',
        safety: 'Safety',
        notifications: 'Notifications',
        rfis: 'RFIs',
        submittals: 'Submittals',
        milestones: 'Milestones',
        crew: 'Crew',
        files: 'Files',
        trade: 'Trade Modules',
        clock: 'Clock In / Out',
        assets: 'Asset Scan',
      },
    },
    projects: {
      title: 'Projects',
      no_projects: 'No projects found',
      status_active: 'Active',
      status_completed: 'Completed',
      status_on_hold: 'On Hold',
      status_cancelled: 'Cancelled',
      detail: 'Project Details',
      'actions.log_time': 'Log Time',
      'actions.daily_report': 'Daily Report',
      'actions.punch_list': 'Punch List',
      'actions.documents': 'Documents',
      'actions.rfis': 'RFIs',
      'actions.submittals': 'Submittals',
      'actions.milestones': 'Milestones',
      'actions.crew': 'Crew',
      'actions.safety': 'Safety',
      'actions.trade': 'Trade Modules',
      'actions.assets': 'Asset QR Scan',
    },
    // ⚠️ Safety strings below — human translation required for ES, no machine translation (P-09)
    safety: {
      incidents_title: 'Safety Incidents',
      report_button: 'Report Incident',
      incident_date: 'Incident Date',
      description: 'Description',
      severity: 'Severity',
      required_note: 'All incidents must be reported immediately to the Safety Officer.',
      emergency_title: 'Emergency Procedures',
      call_911: 'Call 911 for life-threatening emergencies',
      contact_supervisor: 'Contact your supervisor immediately',
      do_not_move: 'Do not move an injured worker unless in immediate danger',
      'severity.near_miss': 'Near Miss',
      'severity.first_aid': 'First Aid',
      'severity.recordable': 'Recordable',
      'severity.lost_time': 'Lost Time',
      'severity.fatality': 'Fatality',
      empty: 'No incidents recorded.',
      report_title: 'Report Incident',
      submitting: 'Reporting...',
      submitted: 'Incident reported. Supervisor notified.',
      pending_sync: 'Saved offline — will sync when connected.',
      error_description_required: 'Please describe what happened.',
      description_placeholder: 'Describe what happened, where, and who was involved…',
      required: 'Required',
    },
    rfi: {
      title: 'RFIs',
      new_button: '+ New RFI',
      empty: 'No RFIs yet',
      modal_title: 'New RFI',
      subject_label: 'Subject *',
      subject_placeholder: 'Describe the information requested',
      cancel: 'Cancel',
      submit: 'Submit RFI',
      submitting: 'Submitting…',
      error_subject_required: 'Subject is required.',
      error_submit_failed: 'Failed to submit RFI. Please try again.',
      required: 'Required',
      error_title: 'Error',
      edit_title: 'Edit RFI',
      status_label: 'Status',
      due_date_label: 'Due date (YYYY-MM-DD)',
      save: 'Save',
      saving: 'Saving…',
      read_only: 'You do not have permission to edit RFIs.',
      conflict_title: 'Out of date',
      conflict_body: 'This RFI changed on the server. Reloaded the latest.',
      status: { draft: 'Draft', open: 'Open', answered: 'Answered', closed: 'Closed' },
    },
    submittals: {
      new_button: '+ New Submittal',
      empty: 'No submittals yet',
      modal_title: 'New Submittal',
      edit_title: 'Submittal',
      title_label: 'Title *',
      title_placeholder: 'e.g. Concrete mix design',
      spec_label: 'Spec Section',
      status_label: 'Status',
      cancel: 'Cancel',
      submit: 'Create',
      submitting: 'Creating…',
      save: 'Save',
      saving: 'Saving…',
      required: 'Required',
      error_title_required: 'Title is required.',
      error_title: 'Error',
      error_submit_failed: 'Could not save. Please try again.',
      read_only: 'You do not have permission to edit submittals.',
      conflict_title: 'Out of date',
      conflict_body: 'This submittal changed on the server. Reloaded the latest.',
      status: {
        draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
        approved: 'Approved', approved_as_noted: 'Approved as Noted',
        rejected: 'Rejected', resubmit: 'Resubmit',
      },
    },
    milestones: {
      new_button: '+ New Milestone',
      empty: 'No milestones yet',
      modal_title: 'New Milestone',
      title_label: 'Title *',
      title_placeholder: 'e.g. Foundation complete',
      due_label: 'Due date (YYYY-MM-DD)',
      cancel: 'Cancel',
      submit: 'Create',
      submitting: 'Creating…',
      required: 'Required',
      error_title_required: 'Title is required.',
      error_title: 'Error',
      error_submit_failed: 'Could not save. Please try again.',
      conflict_title: 'Out of date',
      conflict_body: 'This milestone changed on the server. Reloaded the latest.',
      completed: 'Completed',
      due: 'Due',
      no_due: 'No due date',
    },
    crew: {
      assign_button: '+ Assign Worker',
      empty: 'No crew assigned yet',
      required: 'Required',
      error_user_required: 'Select a worker to assign.',
      error_title: 'Error',
      error_submit_failed: 'Could not save. Please try again.',
      remove_title: 'Remove from crew?',
      remove: 'Remove',
      cancel: 'Cancel',
      no_dates: 'No dates set',
      worker_label: 'Worker',
      no_workers: 'No workers available.',
      role_label: 'Role on job',
      role_placeholder: 'e.g. Lead carpenter',
      start_label: 'Start date',
      end_label: 'End date',
      assign: 'Assign',
      assigning: 'Assigning…',
    },
    field: {
      log_time: 'Log Time',
      date: 'Date',
      hours: 'Hours Worked',
      hourly_rate: 'Hourly Rate (optional)',
      notes: 'Notes (optional)',
      submit: 'Submit',
      time_logged: 'Time logged successfully',
      cost_code: 'Cost Code (optional)',
      budget_line_item: 'Budget Line Item (optional)',
      none_selected: 'None',
      select_cost_code: 'Select Cost Code',
      select_budget_line: 'Select Budget Line Item',
      'daily_report.title': 'Daily Report',
      'daily_report.date': 'Report Date',
      'daily_report.conditions': 'Weather / Site Conditions',
      'daily_report.notes': 'Notes',
      'daily_report.submit': 'Submit Report',
      daily_report_saved: 'Daily report saved successfully',
      time_punches: {
        clock_in: 'Clock In',
        clock_out: 'Clock Out',
        switch_project: 'Switch Project',
        not_clocked_in: 'Not clocked in',
        clocked_in_since: 'Since {{time}} · {{duration}}',
        today_total: 'Today: {{hours}} h',
        punch_history_today: "Today's Punches",
        week_total: '{{hours}} h',
        select_project: 'Select Project',
        no_active_projects: 'No active projects.',
        clock_out_without_project: 'Clock out without project',
        this_week: 'This Week',
        manual_mode_title: 'Manual time tracking is enabled.',
        manual_mode_body: 'Clock in / clock out is not active for your organization.\nUse Time Entry to log hours.',
      },
      timecards: {
        title: 'My Timecard',
        this_week: 'This Week',
        week_of: 'Week of {{date}}',
        regular_hours: 'Regular',
        overtime_hours: 'Overtime',
        total_hours: 'Total',
        hours_unit: 'h',
        open_week: 'Open This Week',
        submit: 'Submit for Approval',
        submitted_note: 'Submitted — awaiting approval',
        approved_note: 'Approved',
        no_card: 'No timecard for this week yet.',
        rejected_note: 'Rejected: {{note}}',
        reopen: 'Open a New Card',
        history: 'Recent Timecards',
        empty_history: 'No timecards yet.',
        confirm_submit: 'Submit this timecard for approval? You will not be able to edit it after.',
        submitted_ok: 'Timecard submitted',
        status: {
          draft: 'Draft',
          submitted: 'Submitted',
          approved: 'Approved',
          rejected: 'Rejected',
        },
      },
      conflicts: {
        kind_time_entry: 'Time',
        kind_punch: 'Punch',
        kind_safety: 'Safety',
        kind_inspection: 'Inspection',
        kind_jsa: 'JSA',
        kind_concrete_test: 'Concrete Test',
        kind_roofing_qa: 'Roofing QA',
        kind_circuit: 'Circuit',
        kind_fixture: 'Fixture',
        field_location: 'Location',
        kind_framing_correction: 'Framing Correction',
        field_measured: 'Measured',
        field_result: 'Result',
        field_date: 'Date',
        field_inspector: 'Inspector',
        safety_blocked: 'Safety-critical — only a Safety Officer or Owner can resolve this. It is held safely and does not block your other work.',
        title: 'Sync Conflicts',
        none: 'No conflicts to resolve.',
        resolve: 'Resolve',
        intro: 'This entry changed on the server. Choose which value to keep for each field.',
        no_diff: 'No differing fields.',
        mine: 'Yours',
        server: 'Server',
        field_hours: 'Hours',
        field_rate: 'Hourly Rate',
        field_cost_code: 'Cost Code',
        field_budget: 'Budget Line',
        field_notes: 'Notes',
        field_description: 'Description',
        field_severity: 'Severity',
        field_status: 'Status',
        tier3_label: 'Safety-critical — must be resolved by a Safety Officer',
        awaiting_officer: 'This safety record is blocked. Only a Safety Officer or Owner can resolve it. It is held safely and does not block your other work.',
        tag_safety: 'Safety',
        tag_time: 'Time',
        tag_punch: 'Punch',
        field_title: 'Title',
        field_due_date: 'Due Date',
        apply: 'Apply Resolution',
        must_resolve_all: 'Choose a value for every field',
        resolved_ok: 'Conflict resolved',
        changed_again: 'It changed again on the server — please review the new values.',
        gone: 'This conflict is no longer available.',
      },
      punch_list: {
        status: {
          open: 'Open',
          in_progress: 'In Progress',
          complete: 'Complete',
        },
        pending_sync: '● Pending sync',
        empty: 'No punch list items yet.',
        add_item: 'Add Item',
        title_placeholder: 'Item title *',
        description_placeholder: 'Description (optional)',
      },
    },
    documents: {
      empty: 'No files yet',
      tap_to_open: 'Tap to open →',
      upload_notice: 'Tap Upload to add a photo. PDFs & docs: use the web portal.',
      status_ready: 'Ready',
      status_scanning: 'Scanning',
      status_rejected: 'Rejected',
      upload: 'Upload',
      uploading: 'Uploading…',
      choose_source: 'Add a file',
      source_camera: 'Take photo',
      source_library: 'Choose from library',
      source_document: 'Choose document (PDF, Office)',
      cancel: 'Cancel',
      saved_offline: 'No connection — saved. It will upload when you reconnect.',
      upload_error: 'Upload failed',
    },
    notifications: {
      empty: 'No notifications',
      unread_count: '{{count}} unread',
      mark_all_read: 'Mark all as read',
      time_minutes_ago: '{{count}}m ago',
      time_hours_ago: '{{count}}h ago',
      time_days_ago: '{{count}}d ago',
    },
    'trade-electrical': {
      electrical: {
        title: 'Electrical',
        panels_title: 'Electrical Panels',
        new_panel: 'New Panel',
        no_panels: 'No electrical panels.',
        panel_name: 'Panel Name',
        amperage: 'Amperage (A)',
        voltage: 'Voltage (V)',
        location: 'Location',
        circuits_title: 'Circuits',
        new_circuit: 'New Circuit',
        no_circuits: 'No circuits.',
        circuit_number: 'Circuit #',
        description: 'Description',
        circuit_status: {
          planned: 'Planned',
          roughed_in: 'Roughed In',
          complete: 'Complete',
        },
      },
    },
    'trade-plumbing': {
      plumbing: {
        title: 'Plumbing',
        systems_title: 'Plumbing Systems',
        new_system: 'New System',
        no_systems: 'No plumbing systems.',
        system_name: 'System Name',
        system_type: 'System Type',
        system_types: {
          supply: 'Supply',
          drain: 'Drain',
          gas: 'Gas',
          fire: 'Fire',
        },
        fixtures_title: 'Fixtures',
        new_fixture: 'New Fixture',
        no_fixtures: 'No fixtures.',
        fixture_type: 'Fixture Type',
        location: 'Location',
        fixture_status: {
          planned: 'Planned',
          rough_in: 'Rough In',
          trimmed: 'Trimmed',
          complete: 'Complete',
        },
      },
    },
  },
  es: {
    common: {
      sign_in: 'Iniciar Sesión',
      sign_out: 'Cerrar Sesión',
      tenant_slug: 'ID de Empresa',
      tenant_slug_placeholder: 'tu-empresa',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      save: 'Guardar',
      cancel: 'Cancelar',
      back: 'Atrás',
      retry: 'Reintentar',
      offline_banner: 'Estás sin conexión. Los cambios se sincronizarán al reconectarse.',
      update_status: 'Cambiar estado',
      update_failed: 'Error al actualizar',
      version_conflict: 'Esto cambió en el servidor. Mostrando lo más reciente.',
      status_read_only: 'Solo el Propietario, PM o Capataz puede cambiar el estado.',
      saved_offline: 'Sin conexión — guardado. Se sincronizará cuando se reconecte.',
      assets: {
        offline_checkout_blocked: 'Sin conexión — puede registrar combustible, una inspección o daños ahora. El registro de salida requiere conexión (la certificación se verifica en el servidor).',
      },
      nav: {
        projects: 'Proyectos',
        pending_uploads: '{{count}} esperando para subir — toca para reintentar',
        uploads_failed_title: '{{count}} no se subieron',
        uploads_failed_body: 'Se guardaron en su dispositivo, pero el servidor los rechazó o se agotaron los reintentos. Reintente ahora o descártelos.',
        uploads_retry: 'Reintentar',
        uploads_discard: 'Descartar',
        directions: 'Cómo llegar',
        log_time: 'Registrar Tiempo',
        daily_report: 'Reporte Diario',
        punch_list: 'Lista de Pendientes',
        safety: 'Seguridad',
        notifications: 'Notificaciones',
        rfis: 'Solicitudes de Información',
        submittals: 'Presentaciones',
        milestones: 'Hitos',
        crew: 'Cuadrilla',
        files: 'Archivos',
        trade: 'Módulos de Comercio',
        clock: 'Entrada / Salida',
        assets: 'Escanear Activo',
      },
    },
    projects: {
      title: 'Proyectos',
      no_projects: 'No se encontraron proyectos',
      status_active: 'Activo',
      status_completed: 'Completado',
      status_on_hold: 'En Espera',
      status_cancelled: 'Cancelado',
      detail: 'Detalles del Proyecto',
      'actions.log_time': 'Registrar Tiempo',
      'actions.daily_report': 'Reporte Diario',
      'actions.punch_list': 'Lista de Pendientes',
      'actions.documents': 'Documentos',
      'actions.rfis': 'Solicitudes de Información',
      'actions.submittals': 'Presentaciones',
      'actions.milestones': 'Hitos',
      'actions.crew': 'Cuadrilla',
      'actions.safety': 'Seguridad',
      'actions.trade': 'Módulos de Comercio',
      'actions.assets': 'Escanear Activo QR',
    },
    // ⚠️ Cadenas de seguridad — se requiere traducción humana profesional (P-09)
    safety: {
      incidents_title: 'Incidentes de Seguridad',
      report_button: 'Reportar Incidente',
      incident_date: 'Fecha del Incidente',
      description: 'Descripción',
      severity: 'Gravedad',
      required_note: 'Todos los incidentes deben reportarse inmediatamente al Oficial de Seguridad.',
      emergency_title: 'Procedimientos de Emergencia',
      call_911: 'Llame al 911 para emergencias que amenacen la vida',
      contact_supervisor: 'Contacte a su supervisor inmediatamente',
      do_not_move: 'No mueva a un trabajador lesionado a menos que esté en peligro inmediato',
      'severity.near_miss': 'Casi Accidente',
      'severity.first_aid': 'Primeros Auxilios',
      'severity.recordable': 'Registrable',
      'severity.lost_time': 'Tiempo Perdido',
      'severity.fatality': 'Fatalidad',
      empty: 'No se han registrado incidentes.',
      report_title: 'Reportar Incidente',
      submitting: 'Reportando...',
      submitted: 'Incidente reportado. Supervisor notificado.',
      pending_sync: 'Guardado sin conexión — se sincronizará cuando haya conexión.',
      error_description_required: 'Por favor describa lo que ocurrió.',
      description_placeholder: 'Describa lo que ocurrió, dónde y quiénes estuvieron involucrados…',
      required: 'Requerido',
    },
    rfi: {
      title: 'Solicitudes de Información',
      new_button: '+ Nueva SdI',
      empty: 'No hay SdIs todavía',
      modal_title: 'Nueva SdI',
      subject_label: 'Asunto *',
      subject_placeholder: 'Describa la información solicitada',
      cancel: 'Cancelar',
      submit: 'Enviar SdI',
      submitting: 'Enviando…',
      error_subject_required: 'El asunto es requerido.',
      error_submit_failed: 'Error al enviar la SdI. Inténtelo de nuevo.',
      required: 'Requerido',
      error_title: 'Error',
      edit_title: 'Editar SdI',
      status_label: 'Estado',
      due_date_label: 'Fecha límite (AAAA-MM-DD)',
      save: 'Guardar',
      saving: 'Guardando…',
      read_only: 'No tiene permiso para editar SdIs.',
      conflict_title: 'Desactualizado',
      conflict_body: 'Esta SdI cambió en el servidor. Se recargó la última versión.',
      status: { draft: 'Borrador', open: 'Abierta', answered: 'Respondida', closed: 'Cerrada' },
    },
    submittals: {
      new_button: '+ Nueva Presentación',
      empty: 'Aún no hay presentaciones',
      modal_title: 'Nueva Presentación',
      edit_title: 'Presentación',
      title_label: 'Título *',
      title_placeholder: 'ej. Diseño de mezcla de concreto',
      spec_label: 'Sección de Especificación',
      status_label: 'Estado',
      cancel: 'Cancelar',
      submit: 'Crear',
      submitting: 'Creando…',
      save: 'Guardar',
      saving: 'Guardando…',
      required: 'Requerido',
      error_title_required: 'El título es obligatorio.',
      error_title: 'Error',
      error_submit_failed: 'No se pudo guardar. Inténtelo de nuevo.',
      read_only: 'No tiene permiso para editar presentaciones.',
      conflict_title: 'Desactualizado',
      conflict_body: 'Esta presentación cambió en el servidor. Se recargó la versión más reciente.',
      status: {
        draft: 'Borrador', submitted: 'Enviada', under_review: 'En Revisión',
        approved: 'Aprobada', approved_as_noted: 'Aprobada con Observaciones',
        rejected: 'Rechazada', resubmit: 'Reenviar',
      },
    },
    milestones: {
      new_button: '+ Nuevo Hito',
      empty: 'Aún no hay hitos',
      modal_title: 'Nuevo Hito',
      title_label: 'Título *',
      title_placeholder: 'ej. Cimientos completos',
      due_label: 'Fecha límite (AAAA-MM-DD)',
      cancel: 'Cancelar',
      submit: 'Crear',
      submitting: 'Creando…',
      required: 'Requerido',
      error_title_required: 'El título es obligatorio.',
      error_title: 'Error',
      error_submit_failed: 'No se pudo guardar. Inténtelo de nuevo.',
      conflict_title: 'Desactualizado',
      conflict_body: 'Este hito cambió en el servidor. Se recargó la versión más reciente.',
      completed: 'Completado',
      due: 'Vence',
      no_due: 'Sin fecha límite',
    },
    crew: {
      assign_button: '+ Asignar Trabajador',
      empty: 'Aún no hay cuadrilla asignada',
      required: 'Requerido',
      error_user_required: 'Seleccione un trabajador para asignar.',
      error_title: 'Error',
      error_submit_failed: 'No se pudo guardar. Inténtelo de nuevo.',
      remove_title: '¿Quitar de la cuadrilla?',
      remove: 'Quitar',
      cancel: 'Cancelar',
      no_dates: 'Sin fechas',
      worker_label: 'Trabajador',
      no_workers: 'No hay trabajadores disponibles.',
      role_label: 'Función en la obra',
      role_placeholder: 'ej. Carpintero principal',
      start_label: 'Fecha de inicio',
      end_label: 'Fecha de fin',
      assign: 'Asignar',
      assigning: 'Asignando…',
    },
    field: {
      log_time: 'Registrar Tiempo',
      date: 'Fecha',
      hours: 'Horas Trabajadas',
      hourly_rate: 'Tarifa por Hora (opcional)',
      notes: 'Notas (opcional)',
      submit: 'Enviar',
      time_logged: 'Tiempo registrado exitosamente',
      cost_code: 'Código de Costo (opcional)',
      budget_line_item: 'Partida de Presupuesto (opcional)',
      none_selected: 'Ninguno',
      select_cost_code: 'Seleccionar Código de Costo',
      select_budget_line: 'Seleccionar Partida de Presupuesto',
      'daily_report.title': 'Reporte Diario',
      'daily_report.date': 'Fecha del Reporte',
      'daily_report.conditions': 'Condiciones del Clima / Sitio',
      'daily_report.notes': 'Notas',
      'daily_report.submit': 'Enviar Reporte',
      daily_report_saved: 'Reporte diario guardado exitosamente',
      time_punches: {
        clock_in: 'Marcar Entrada',
        clock_out: 'Marcar Salida',
        switch_project: 'Cambiar Proyecto',
        not_clocked_in: 'Sin marcar entrada',
        clocked_in_since: 'Desde {{time}} · {{duration}}',
        today_total: 'Hoy: {{hours}} h',
        punch_history_today: 'Marcas de Hoy',
        week_total: '{{hours}} h',
        select_project: 'Seleccionar Proyecto',
        no_active_projects: 'No hay proyectos activos.',
        clock_out_without_project: 'Marcar salida sin proyecto',
        this_week: 'Esta Semana',
        manual_mode_title: 'El registro manual de tiempo está activado.',
        manual_mode_body: 'Marcar entrada / salida no está activo para su organización.\nUse Registrar Tiempo para registrar horas.',
      },
      timecards: {
        title: 'Mi Tarjeta de Tiempo',
        this_week: 'Esta Semana',
        week_of: 'Semana del {{date}}',
        regular_hours: 'Regular',
        overtime_hours: 'Horas Extra',
        total_hours: 'Total',
        hours_unit: 'h',
        open_week: 'Abrir Esta Semana',
        submit: 'Enviar para Aprobación',
        submitted_note: 'Enviada — esperando aprobación',
        approved_note: 'Aprobada',
        no_card: 'Aún no hay tarjeta para esta semana.',
        rejected_note: 'Rechazada: {{note}}',
        reopen: 'Abrir una Nueva Tarjeta',
        history: 'Tarjetas Recientes',
        empty_history: 'Aún no hay tarjetas.',
        confirm_submit: '¿Enviar esta tarjeta para aprobación? No podrá editarla después.',
        submitted_ok: 'Tarjeta enviada',
        status: {
          draft: 'Borrador',
          submitted: 'Enviada',
          approved: 'Aprobada',
          rejected: 'Rechazada',
        },
      },
      conflicts: {
        kind_time_entry: 'Tiempo',
        kind_punch: 'Pendiente',
        kind_safety: 'Seguridad',
        kind_inspection: 'Inspección',
        kind_jsa: 'ATS',
        kind_concrete_test: 'Prueba de Concreto',
        kind_roofing_qa: 'Calidad de Techado',
        kind_circuit: 'Circuito',
        kind_fixture: 'Accesorio',
        field_location: 'Ubicación',
        kind_framing_correction: 'Corrección de Estructura',
        field_measured: 'Medido',
        field_result: 'Resultado',
        field_date: 'Fecha',
        field_inspector: 'Inspector',
        safety_blocked: 'Crítico de seguridad — solo un Oficial de Seguridad o Propietario puede resolverlo. Se conserva de forma segura y no bloquea su otro trabajo.',
        title: 'Conflictos de Sincronización',
        none: 'No hay conflictos por resolver.',
        resolve: 'Resolver',
        intro: 'Esta entrada cambió en el servidor. Elija qué valor conservar para cada campo.',
        no_diff: 'No hay campos diferentes.',
        mine: 'Tuyo',
        server: 'Servidor',
        field_hours: 'Horas',
        field_rate: 'Tarifa por Hora',
        field_cost_code: 'Código de Costo',
        field_budget: 'Partida de Presupuesto',
        field_notes: 'Notas',
        field_description: 'Descripción',
        field_severity: 'Gravedad',
        field_status: 'Estado',
        tier3_label: 'Crítico de seguridad — debe resolverlo un Oficial de Seguridad',
        awaiting_officer: 'Este registro de seguridad está bloqueado. Solo un Oficial de Seguridad o Propietario puede resolverlo. Se conserva de forma segura y no bloquea su otro trabajo.',
        tag_safety: 'Seguridad',
        tag_time: 'Tiempo',
        tag_punch: 'Pendiente',
        field_title: 'Título',
        field_due_date: 'Fecha límite',
        apply: 'Aplicar Resolución',
        must_resolve_all: 'Elija un valor para cada campo',
        resolved_ok: 'Conflicto resuelto',
        changed_again: 'Cambió de nuevo en el servidor — revise los nuevos valores.',
        gone: 'Este conflicto ya no está disponible.',
      },
      punch_list: {
        status: {
          open: 'Abierto',
          in_progress: 'En Progreso',
          complete: 'Completo',
        },
        pending_sync: '● Sincronización pendiente',
        empty: 'No hay elementos en la lista de pendientes.',
        add_item: 'Agregar Elemento',
        title_placeholder: 'Título del elemento *',
        description_placeholder: 'Descripción (opcional)',
      },
    },
    documents: {
      empty: 'Aún no hay archivos',
      tap_to_open: 'Toque para abrir →',
      upload_notice: 'Toque Subir para agregar una foto. PDF y documentos: use el portal web.',
      status_ready: 'Listo',
      status_scanning: 'Escaneando',
      status_rejected: 'Rechazado',
      upload: 'Subir',
      uploading: 'Subiendo…',
      choose_source: 'Agregar un archivo',
      source_camera: 'Tomar foto',
      source_library: 'Elegir de la galería',
      source_document: 'Elegir documento (PDF, Office)',
      cancel: 'Cancelar',
      saved_offline: 'Sin conexión — guardado. Se subirá cuando se reconecte.',
      upload_error: 'Error al subir',
    },
    notifications: {
      empty: 'Sin notificaciones',
      unread_count: '{{count}} sin leer',
      mark_all_read: 'Marcar todo como leído',
      time_minutes_ago: 'hace {{count}}m',
      time_hours_ago: 'hace {{count}}h',
      time_days_ago: 'hace {{count}}d',
    },
    'trade-electrical': {
      electrical: {
        title: 'Eléctrico',
        panels_title: 'Tableros Eléctricos',
        new_panel: 'Nuevo Tablero',
        no_panels: 'No hay tableros eléctricos.',
        panel_name: 'Nombre del Tablero',
        amperage: 'Amperaje (A)',
        voltage: 'Voltaje (V)',
        location: 'Ubicación',
        circuits_title: 'Circuitos',
        new_circuit: 'Nuevo Circuito',
        no_circuits: 'No hay circuitos.',
        circuit_number: 'Circuito #',
        description: 'Descripción',
        circuit_status: {
          planned: 'Planeado',
          roughed_in: 'Tubería Instalada',
          complete: 'Completado',
        },
      },
    },
    'trade-plumbing': {
      plumbing: {
        title: 'Plomería',
        systems_title: 'Sistemas de Plomería',
        new_system: 'Nuevo Sistema',
        no_systems: 'No hay sistemas de plomería.',
        system_name: 'Nombre del Sistema',
        system_type: 'Tipo de Sistema',
        system_types: {
          supply: 'Suministro',
          drain: 'Drenaje',
          gas: 'Gas',
          fire: 'Contra Incendios',
        },
        fixtures_title: 'Accesorios',
        new_fixture: 'Nuevo Accesorio',
        no_fixtures: 'No hay accesorios.',
        fixture_type: 'Tipo de Accesorio',
        location: 'Ubicación',
        fixture_status: {
          planned: 'Planeado',
          rough_in: 'Instalación Preliminar',
          trimmed: 'Acabado',
          complete: 'Completado',
        },
      },
    },
  },
};

// Builder warranty translations
(resources.en as any).warranties = {
  no_warranties: 'No warranties found',
  open_claims: 'open claims',
  not_found: 'Not found',
  property: 'Property',
  homeowner: 'Homeowner',
  effective: 'Effective',
  coverage: 'Coverage',
  months: 'months',
  expires: 'expires',
  recent_claims: 'Recent Claims',
  new_claim: 'New Claim',
  no_claims: 'No claims yet',
  status: 'Claim Status',
  scheduled_repair: 'Scheduled Repair',
  resolution_notes: 'Resolution Notes',
  claim_title: 'Claim Title',
  title_placeholder: 'Briefly describe the issue',
  description: 'Description',
  description_placeholder: 'Provide details about the defect or issue...',
  category: 'Category',
  category_workmanship: 'Workmanship',
  category_systems: 'Systems',
  category_structural: 'Structural',
  category_other: 'Other',
  priority: 'Priority',
  priority_low: 'Low',
  priority_medium: 'Medium',
  priority_high: 'High',
  priority_urgent: 'Urgent',
  submit_claim: 'Submit Claim',
  error: 'Error',
  title_and_description_required: 'Title and description are required',
  submit_failed: 'Failed to submit claim. Please try again.',
};

(resources as any).es ??= {};
((resources as any).es as any).warranties = {
  no_warranties: 'No se encontraron garantías',
  open_claims: 'reclamaciones abiertas',
  not_found: 'No encontrado',
  property: 'Propiedad',
  homeowner: 'Propietario',
  effective: 'Vigencia',
  coverage: 'Cobertura',
  months: 'meses',
  expires: 'vence',
  recent_claims: 'Reclamaciones Recientes',
  new_claim: 'Nueva Reclamación',
  no_claims: 'Sin reclamaciones',
  status: 'Estado de Reclamación',
  scheduled_repair: 'Reparación Programada',
  resolution_notes: 'Notas de Resolución',
  claim_title: 'Título de Reclamación',
  title_placeholder: 'Describa brevemente el problema',
  description: 'Descripción',
  description_placeholder: 'Proporcione detalles sobre el defecto o problema...',
  category: 'Categoría',
  category_workmanship: 'Mano de Obra',
  category_systems: 'Sistemas',
  category_structural: 'Estructural',
  category_other: 'Otro',
  priority: 'Prioridad',
  priority_low: 'Baja',
  priority_medium: 'Media',
  priority_high: 'Alta',
  priority_urgent: 'Urgente',
  submit_claim: 'Enviar Reclamación',
  error: 'Error',
  title_and_description_required: 'El título y la descripción son obligatorios',
  submit_failed: 'Error al enviar la reclamación. Inténtelo de nuevo.',
};

// Permits / AHJ inspections (Session 31) — trade-aware permit screens.
(resources.en as any).common.nav.permits = 'Permits';
(resources.es as any).common.nav.permits = 'Permisos';
(resources.en as any).projects['actions.permits'] = 'Permits';
(resources.es as any).projects['actions.permits'] = 'Permisos';

(resources.en as any).permits = {
  no_permits: 'No permits found',
  pending: 'Pending',
  inspections_title: 'Inspections',
  ahj_level_state: 'state',
  ahj_level_county: 'county',
  ahj_level_city: 'city',
  no_inspections: 'No inspection milestones yet',
  no_date: 'No date set',
  record_result: 'Record result',
  inspection_date: 'Inspection Date',
  inspector_name: 'Inspector Name',
  inspector_placeholder: 'Inspector name',
  result: 'Result',
  result_pass: 'Pass',
  result_fail: 'Fail',
  result_partial: 'Partial',
  cancel: 'Cancel',
  save: 'Save',
  saving: 'Saving…',
  update_failed: 'Update failed',
  conflict: 'This record changed on the server. Pull to refresh and try again.',
  type_electrical: 'Electrical',
  type_plumbing: 'Plumbing',
  type_mechanical: 'Mechanical (HVAC)',
  type_building: 'Building',
  status_draft: 'Draft',
  status_submitted: 'Submitted',
  status_approved: 'Approved',
  status_active: 'Active',
  status_failed_inspection: 'Failed Inspection',
  status_closed: 'Closed',
  status_voided: 'Voided',
};

(resources.es as any).permits = {
  no_permits: 'No se encontraron permisos',
  pending: 'Pendiente',
  inspections_title: 'Inspecciones',
  ahj_level_state: 'estatal',
  ahj_level_county: 'condado',
  ahj_level_city: 'municipal',
  no_inspections: 'Aún no hay hitos de inspección',
  no_date: 'Sin fecha',
  record_result: 'Registrar resultado',
  inspection_date: 'Fecha de Inspección',
  inspector_name: 'Nombre del Inspector',
  inspector_placeholder: 'Nombre del inspector',
  result: 'Resultado',
  result_pass: 'Aprobado',
  result_fail: 'Reprobado',
  result_partial: 'Parcial',
  cancel: 'Cancelar',
  save: 'Guardar',
  saving: 'Guardando…',
  update_failed: 'Error al actualizar',
  conflict: 'Este registro cambió en el servidor. Deslice para actualizar e inténtelo de nuevo.',
  type_electrical: 'Eléctrico',
  type_plumbing: 'Plomería',
  type_mechanical: 'Mecánico (HVAC)',
  type_building: 'Construcción',
  status_draft: 'Borrador',
  status_submitted: 'Enviado',
  status_approved: 'Aprobado',
  status_active: 'Activo',
  status_failed_inspection: 'Inspección Fallida',
  status_closed: 'Cerrado',
  status_voided: 'Anulado',
};

// Structural trades (Session 31) — roofing / concrete / framing field view.
(resources.en as any).common.nav.structural = 'Structural';
(resources.es as any).common.nav.structural = 'Estructural';
(resources.en as any).projects['actions.structural'] = 'Structural';
(resources.es as any).projects['actions.structural'] = 'Estructural';

(resources.en as any).structural = {
  roofing: 'Roofing', concrete: 'Concrete', framing: 'Framing', none: 'Nothing recorded yet',
  roof_asphalt_shingle: 'Asphalt Shingle', roof_metal: 'Metal', roof_flat_tpo: 'Flat — TPO',
  roof_flat_epdm: 'Flat — EPDM', roof_tile: 'Tile', roof_cedar_shake: 'Cedar Shake', roof_other: 'Other',
  rstatus_planned: 'Planned', rstatus_tear_off: 'Tear-Off', rstatus_decking: 'Decking',
  rstatus_underlayment: 'Underlayment', rstatus_installed: 'Installed', rstatus_inspected: 'Inspected', rstatus_complete: 'Complete',
  pour_slab: 'Slab', pour_footing: 'Footing', pour_wall: 'Wall', pour_column: 'Column', pour_driveway: 'Driveway', pour_other: 'Other',
  cstatus_planned: 'Planned', cstatus_in_progress: 'In Progress', cstatus_complete: 'Complete', cstatus_failed: 'Failed',
  section_exterior_walls: 'Exterior Walls', section_roof_trusses: 'Roof Trusses', section_floor_system: 'Floor System',
  section_sheathing: 'Sheathing', section_interior_walls: 'Interior Walls', section_other: 'Other',
  fstatus_pending: 'Pending', fstatus_passed: 'Passed', fstatus_failed: 'Failed', fstatus_requires_correction: 'Requires Correction',
};

(resources.es as any).structural = {
  roofing: 'Techado', concrete: 'Concreto', framing: 'Estructura', none: 'Aún no hay registros',
  roof_asphalt_shingle: 'Teja Asfáltica', roof_metal: 'Metal', roof_flat_tpo: 'Plano — TPO',
  roof_flat_epdm: 'Plano — EPDM', roof_tile: 'Teja', roof_cedar_shake: 'Tejamanil de Cedro', roof_other: 'Otro',
  rstatus_planned: 'Planificado', rstatus_tear_off: 'Demolición', rstatus_decking: 'Entablado',
  rstatus_underlayment: 'Membrana', rstatus_installed: 'Instalado', rstatus_inspected: 'Inspeccionado', rstatus_complete: 'Completo',
  pour_slab: 'Losa', pour_footing: 'Zapata', pour_wall: 'Muro', pour_column: 'Columna', pour_driveway: 'Entrada', pour_other: 'Otro',
  cstatus_planned: 'Planificado', cstatus_in_progress: 'En Progreso', cstatus_complete: 'Completo', cstatus_failed: 'Fallido',
  section_exterior_walls: 'Muros Exteriores', section_roof_trusses: 'Armaduras de Techo', section_floor_system: 'Sistema de Piso',
  section_sheathing: 'Revestimiento', section_interior_walls: 'Muros Interiores', section_other: 'Otro',
  fstatus_pending: 'Pendiente', fstatus_passed: 'Aprobado', fstatus_failed: 'Reprobado', fstatus_requires_correction: 'Requiere Corrección',
};

// ─── Tasks (schedule task detail + QA photos + codes) ────────────────────────────────────────
// projects.actions.* are FLAT dotted keys (no nested actions:{} object) — use bracket form
// or this throws at bundle load (see CLAUDE.md i18n flat-key gotcha).
(resources.en as any).common.nav.tasks = 'Tasks';
(resources.es as any).common.nav.tasks = 'Tareas';
(resources.en as any).projects['actions.tasks'] = 'Tasks';
(resources.es as any).projects['actions.tasks'] = 'Tareas';

(resources.en as any).tasks = {
  no_tasks: 'No tasks yet.', load_failed: 'Failed to load task', update_failed: 'Update failed',
  conflict: 'This task was updated elsewhere — reload.',
  status: 'Status', complete_suffix: 'complete',
  status_not_started: 'Not Started', status_in_progress: 'In Progress', status_on_hold: 'On Hold', status_complete: 'Complete',
  codes: 'Codes & Compliance', no_codes: 'No trade set — no applicable codes.',
  inspections: 'Inspection sequence', optional: 'optional',
  insp_status_passed: 'passed', insp_status_failed: 'failed', insp_status_requires_action: 'requires action',
  insp_status_scheduled: 'scheduled', insp_status_not_created: 'not scheduled',
  ahj_level_state: 'State', ahj_level_county: 'County', ahj_level_city: 'City',
  photos: 'QA / Proof Photos', add_photo: '+ Add photo', uploading: 'Uploading…',
  upload_failed: 'Photo upload failed', no_photos: 'No photos yet.',
  still_scanning: 'Photo is still being processed — pull to refresh shortly.',
  work_steps: 'Work Steps', no_steps: 'No work steps yet.', code_refs: 'Codes',
  rebuild_steps: 'Rebuild', rebuilding: 'Rebuilding…', rebuild_failed: 'Could not rebuild steps',
  rebuilt: 'Work steps rebuilt',
  signs_off: 'Inspection', tools: 'Tools', materials: 'Materials', qa: 'QA',
  equipment: 'Equipment', equipment_optional: '(optional)',
  equipment_available: '{{n}} available', equipment_owned_none_free: '{{n}} owned, none free', equipment_none_owned: 'not in fleet',
  dependencies: 'Dependencies', predecessors: 'Prerequisites', successors: 'Unblocks',
  phase_site_prep: 'Site Prep', phase_foundation: 'Foundation', phase_framing: 'Framing', phase_roofing: 'Roofing',
  phase_rough_in: 'Rough MEP', phase_inspections: 'Inspections', phase_insulation: 'Insulation', phase_drywall: 'Drywall',
  phase_finishes_interior: 'Interior', phase_finishes_exterior: 'Exterior', phase_sitework: 'Site Work',
  phase_commissioning: 'Commissioning', phase_punch: 'Punch', phase_unassigned: 'Unassigned',
};

(resources.es as any).tasks = {
  no_tasks: 'Aún no hay tareas.', load_failed: 'Error al cargar la tarea', update_failed: 'Error al actualizar',
  conflict: 'Esta tarea se actualizó en otro lugar — recargue.',
  status: 'Estado', complete_suffix: 'completado',
  status_not_started: 'Sin Iniciar', status_in_progress: 'En Progreso', status_on_hold: 'En Espera', status_complete: 'Completado',
  codes: 'Códigos y cumplimiento', no_codes: 'Sin oficio asignado — no hay códigos aplicables.',
  inspections: 'Secuencia de inspección', optional: 'opcional',
  insp_status_passed: 'aprobada', insp_status_failed: 'reprobada', insp_status_requires_action: 'requiere acción',
  insp_status_scheduled: 'programada', insp_status_not_created: 'no programada',
  ahj_level_state: 'Estatal', ahj_level_county: 'Condado', ahj_level_city: 'Ciudad',
  photos: 'Fotos de QA / evidencia', add_photo: '+ Agregar foto', uploading: 'Subiendo…',
  upload_failed: 'Error al subir la foto', no_photos: 'Aún no hay fotos.',
  still_scanning: 'La foto se está procesando — deslice para actualizar en breve.',
  work_steps: 'Pasos de trabajo', no_steps: 'Aún no hay pasos.', code_refs: 'Códigos',
  rebuild_steps: 'Regenerar', rebuilding: 'Regenerando…', rebuild_failed: 'No se pudieron regenerar los pasos',
  rebuilt: 'Pasos de trabajo regenerados',
  signs_off: 'Inspección', tools: 'Herramientas', materials: 'Materiales', qa: 'Control de calidad',
  equipment: 'Equipo', equipment_optional: '(opcional)',
  equipment_available: '{{n}} disponible(s)', equipment_owned_none_free: '{{n}} en flota, ninguno libre', equipment_none_owned: 'no está en la flota',
  dependencies: 'Dependencias', predecessors: 'Requisitos previos', successors: 'Desbloquea',
  phase_site_prep: 'Preparación', phase_foundation: 'Cimentación', phase_framing: 'Estructura', phase_roofing: 'Techado',
  phase_rough_in: 'MEP en bruto', phase_inspections: 'Inspecciones', phase_insulation: 'Aislamiento', phase_drywall: 'Tablaroca',
  phase_finishes_interior: 'Interior', phase_finishes_exterior: 'Exterior', phase_sitework: 'Obra exterior',
  phase_commissioning: 'Puesta en marcha', phase_punch: 'Pendientes', phase_unassigned: 'Sin asignar',
};

// ─── Notification preferences (rendered inline in Settings) ──────────────────────────────────────
(resources.en as any).notif_prefs = {
  title: 'Notifications', hint: 'Choose how you are notified.',
  chan_push: 'Push', chan_email: 'Email', chan_sms: 'SMS',
  cat_project: 'Project', cat_financial: 'Financial', cat_system: 'System',
  cat_cross_tenant: 'Collaboration', cat_safety: 'Safety',
  safety_locked: 'Always on', save_failed: 'Could not save',
};
(resources.es as any).notif_prefs = {
  title: 'Notificaciones', hint: 'Elige cómo recibir avisos.',
  chan_push: 'Push', chan_email: 'Correo', chan_sms: 'SMS',
  cat_project: 'Proyecto', cat_financial: 'Finanzas', cat_system: 'Sistema',
  cat_cross_tenant: 'Colaboración', cat_safety: 'Seguridad',
  safety_locked: 'Siempre activo', save_failed: 'No se pudo guardar',
};

// ─── Profile editor (rendered inline in Settings) ────────────────────────────────────────────────
(resources.en as any).profile = {
  title: 'Profile', first_name: 'First name', last_name: 'Last name', email: 'Email',
  save: 'Save', saved: 'Profile saved', save_failed: 'Could not save',
};
(resources.es as any).profile = {
  title: 'Perfil', first_name: 'Nombre', last_name: 'Apellido', email: 'Correo',
  save: 'Guardar', saved: 'Perfil guardado', save_failed: 'No se pudo guardar',
};

// ─── Timecard nav entry (field.timecards.* defined inline in the field block above) ──────────────
(resources.en as any).common.nav.timecard = 'My Timecard';
(resources.es as any).common.nav.timecard = 'Mi Tarjeta';
(resources.en as any).common.nav.conflicts = 'Sync Conflicts';
(resources.es as any).common.nav.conflicts = 'Conflictos';
// common.nav is a real nested object — safe to extend with dotted access.
(resources.en as any).common.nav.warranties = 'Warranties';
(resources.es as any).common.nav.warranties = 'Garantías';
(resources.en as any).common.nav.settings = 'Settings';
(resources.es as any).common.nav.settings = 'Configuración';
(resources.en as any).common.nav.home = 'Home';
(resources.es as any).common.nav.home = 'Inicio';
(resources.en as any).common.nav.alerts = 'Alerts';
(resources.es as any).common.nav.alerts = 'Alertas';
(resources.en as any).common.nav.connections = 'Connections';
(resources.es as any).common.nav.connections = 'Conexiones';

// `connections` is a brand-new top-level namespace — normal nested literal (no flat-key trap).
// Cross-tenant bridge (P-02) mobile surface: list + detail + accept/decline.
(resources.en as any).connections = {
  status_pending: 'Pending',
  status_active: 'Active',
  status_completed: 'Completed',
  status_revoked: 'Revoked',
  status_rejected: 'Declined',
  no_active: 'No active connections.',
  no_pending: 'No pending invites.',
  no_completed: 'No completed connections.',
  no_revoked: 'No revoked connections.',
  no_rejected: 'No declined invites.',
  upgrade_title: 'Cross-company collaboration',
  upgrade_body: 'Connecting with other companies requires the Cross-Tenant add-on (included in Business and Enterprise plans). Manage your plan on the web dashboard.',
  detail_error: 'Failed to load connection.',
  contract_value: 'Contract value',
  gc_project: 'GC project',
  my_project: 'Your project',
  closed_reason: 'Closed',
  accept_title: 'Accept invitation?',
  accept_confirm: 'Accepting creates a linked project in your company for this work. You can collaborate through the shared activity feed.',
  accept_btn: 'Accept',
  decline_title: 'Decline invitation?',
  decline_confirm: 'The general contractor will be notified. They can re-invite you later.',
  decline_btn: 'Decline',
  cancel: 'Cancel',
  action_failed: 'Action failed',
  activity_title: 'Shared activity',
  no_events: 'No shared activity yet.',
  load_more: 'Load more',
  ev_rfi: 'RFI update',
  ev_change_order: 'Change order update',
  ev_submittal: 'Submittal update',
  ev_invoice: 'Invoice update',
  ev_lien_waiver: 'Lien waiver update',
  ev_daily_report: 'Daily report shared',
  ev_labor: 'Labor summary shared',
  ev_message: 'Message',
  ev_milestone: 'Milestone update',
  ev_schedule: 'Schedule update',
  ev_location: 'Site location shared',
  ev_connection: 'Connection update',
  ev_generic: 'Shared update',
};
(resources.es as any).connections = {
  status_pending: 'Pendiente',
  status_active: 'Activa',
  status_completed: 'Completada',
  status_revoked: 'Revocada',
  status_rejected: 'Rechazada',
  no_active: 'No hay conexiones activas.',
  no_pending: 'No hay invitaciones pendientes.',
  no_completed: 'No hay conexiones completadas.',
  no_revoked: 'No hay conexiones revocadas.',
  no_rejected: 'No hay invitaciones rechazadas.',
  upgrade_title: 'Colaboración entre empresas',
  upgrade_body: 'Conectarse con otras empresas requiere el complemento Cross-Tenant (incluido en los planes Business y Enterprise). Gestione su plan en el panel web.',
  detail_error: 'No se pudo cargar la conexión.',
  contract_value: 'Valor del contrato',
  gc_project: 'Proyecto del contratista',
  my_project: 'Su proyecto',
  closed_reason: 'Cerrada',
  accept_title: '¿Aceptar la invitación?',
  accept_confirm: 'Al aceptar se crea un proyecto vinculado en su empresa para este trabajo. Podrá colaborar mediante el registro de actividad compartida.',
  accept_btn: 'Aceptar',
  decline_title: '¿Rechazar la invitación?',
  decline_confirm: 'Se notificará al contratista general. Podrá volver a invitarlo más adelante.',
  decline_btn: 'Rechazar',
  cancel: 'Cancelar',
  action_failed: 'La acción falló',
  activity_title: 'Actividad compartida',
  no_events: 'Aún no hay actividad compartida.',
  load_more: 'Cargar más',
  ev_rfi: 'Actualización de RFI',
  ev_change_order: 'Actualización de orden de cambio',
  ev_submittal: 'Actualización de submittal',
  ev_invoice: 'Actualización de factura',
  ev_lien_waiver: 'Actualización de renuncia de gravamen',
  ev_daily_report: 'Reporte diario compartido',
  ev_labor: 'Resumen de mano de obra compartido',
  ev_message: 'Mensaje',
  ev_milestone: 'Actualización de hito',
  ev_schedule: 'Actualización de cronograma',
  ev_location: 'Ubicación del sitio compartida',
  ev_connection: 'Actualización de conexión',
  ev_generic: 'Actualización compartida',
};

// `settings` is a brand-new top-level namespace — author as a normal nested literal (no flat-key trap).
(resources.en as any).settings = {
  title: 'Settings',
  layout: 'Layout',
  layout_hint: 'Hide actions you do not use. You can only hide what your role allows.',
  language: 'Language',
  english: 'English',
  spanish: 'Spanish',
  theme: 'Appearance',
  theme_system: 'System',
  theme_light: 'Light',
  theme_dark: 'Dark',
  show: 'Shown',
  hide: 'Hidden',
  section_project: 'Project actions',
  section_global: 'Quick actions',
  updates: 'Updates',
  show_updates: "Show what's new after updates",
};
(resources.es as any).settings = {
  title: 'Configuración',
  layout: 'Diseño',
  layout_hint: 'Oculta las acciones que no usas. Solo puedes ocultar lo que tu rol permite.',
  language: 'Idioma',
  english: 'Inglés',
  spanish: 'Español',
  theme: 'Apariencia',
  theme_system: 'Sistema',
  theme_light: 'Claro',
  theme_dark: 'Oscuro',
  show: 'Visible',
  hide: 'Oculto',
  section_project: 'Acciones de proyecto',
  section_global: 'Acciones rápidas',
  updates: 'Novedades',
  show_updates: 'Mostrar novedades tras las actualizaciones',
};

// ── Inspections (standalone) + Safety certifications (Doc 19 §4 P0 #1) ──────────
// nav.* + flat projects['actions.x'] follow the established flat-vs-nested rule.
(resources.en as any).common.nav.inspections = 'Inspections';
(resources.es as any).common.nav.inspections = 'Inspecciones';
(resources.en as any).common.nav.safety_certs = 'Certifications';
(resources.es as any).common.nav.safety_certs = 'Certificaciones';
(resources.en as any).projects['actions.inspections'] = 'Inspections';
(resources.es as any).projects['actions.inspections'] = 'Inspecciones';

// New top-level namespaces — authored as nested literals (no flat-key trap).
(resources.en as any).inspections = {
  empty: 'No inspections yet',
  new_button: '+ New',
  modal_title: 'New Inspection',
  title_label: 'Title',
  title_placeholder: 'e.g. Rough-in inspection',
  inspector_label: 'Inspector (optional)',
  inspector_placeholder: 'Inspector name',
  no_date: 'No date',
  set_status: 'Set status',
  required: 'Required',
  error_title_required: 'Enter a title.',
  error_title: 'Error',
  error_submit_failed: 'Could not save. Try again.',
  conflict_title: 'Out of date',
  conflict_body: 'This inspection changed on the server. Reloaded the latest.',
  cancel: 'Cancel',
  submit: 'Create',
  submitting: 'Saving…',
  status: {
    scheduled: 'SCHEDULED',
    passed: 'PASSED',
    failed: 'FAILED',
    requires_action: 'ACTION',
  },
};
(resources.es as any).inspections = {
  empty: 'Sin inspecciones aún',
  new_button: '+ Nueva',
  modal_title: 'Nueva inspección',
  title_label: 'Título',
  title_placeholder: 'ej. Inspección de instalación',
  inspector_label: 'Inspector (opcional)',
  inspector_placeholder: 'Nombre del inspector',
  no_date: 'Sin fecha',
  set_status: 'Cambiar estado',
  required: 'Requerido',
  error_title_required: 'Ingrese un título.',
  error_title: 'Error',
  error_submit_failed: 'No se pudo guardar. Intente de nuevo.',
  conflict_title: 'Desactualizado',
  conflict_body: 'Esta inspección cambió en el servidor. Se recargó la última versión.',
  cancel: 'Cancelar',
  submit: 'Crear',
  submitting: 'Guardando…',
  status: {
    scheduled: 'PROGRAMADA',
    passed: 'APROBADA',
    failed: 'RECHAZADA',
    requires_action: 'ACCIÓN',
  },
};

(resources.en as any).safety_certs = {
  empty: 'No certifications yet',
  new_button: '+ Add',
  modal_title: 'Add Certification',
  worker_label: 'Worker',
  worker_placeholder: 'Select a worker',
  no_workers: 'No workers found',
  unknown_worker: 'Unknown worker',
  type_label: 'Certification type',
  type_placeholder: 'e.g. OSHA 30',
  issued_label: 'Issued (optional)',
  expires_label: 'Expires (optional)',
  expires: 'Expires',
  no_expiry: 'No expiry',
  required: 'Required',
  error_user_required: 'Select a worker.',
  error_type_required: 'Enter a certification type.',
  error_date_format: 'Dates must be YYYY-MM-DD.',
  error_title: 'Error',
  error_submit_failed: 'Could not save. Try again.',
  cancel: 'Cancel',
  submit: 'Add',
  submitting: 'Saving…',
  exp: {
    expired: 'EXPIRED',
    expiring: 'EXPIRING',
    valid: 'VALID',
    none: 'NO EXPIRY',
  },
};
(resources.es as any).safety_certs = {
  empty: 'Sin certificaciones aún',
  new_button: '+ Agregar',
  modal_title: 'Agregar certificación',
  worker_label: 'Trabajador',
  worker_placeholder: 'Seleccione un trabajador',
  no_workers: 'No se encontraron trabajadores',
  unknown_worker: 'Trabajador desconocido',
  type_label: 'Tipo de certificación',
  type_placeholder: 'ej. OSHA 30',
  issued_label: 'Emitida (opcional)',
  expires_label: 'Vence (opcional)',
  expires: 'Vence',
  no_expiry: 'Sin vencimiento',
  required: 'Requerido',
  error_user_required: 'Seleccione un trabajador.',
  error_type_required: 'Ingrese un tipo de certificación.',
  error_date_format: 'Las fechas deben ser AAAA-MM-DD.',
  error_title: 'Error',
  error_submit_failed: 'No se pudo guardar. Intente de nuevo.',
  cancel: 'Cancelar',
  submit: 'Agregar',
  submitting: 'Guardando…',
  exp: {
    expired: 'VENCIDA',
    expiring: 'POR VENCER',
    valid: 'VIGENTE',
    none: 'SIN VENC.',
  },
};

// `whatsnew` — "What's New" popup chrome (release-note bullets come from changelog.ts, not i18n).
// Brand-new top-level namespace — authored as a nested literal (no flat-key trap).
(resources.en as any).whatsnew = {
  title: "What's New",
  version: 'Version {{version}}',
  dismiss: 'Got it',
  disable_hint: 'You can turn these messages off in Settings.',
};
(resources.es as any).whatsnew = {
  title: 'Novedades',
  version: 'Versión {{version}}',
  dismiss: 'Entendido',
  disable_hint: 'Puedes desactivar estos mensajes en Configuración.',
};

// ── Unified Time hub (single "Time" tab) — Session 43 ──────────────────────────
// common.nav is a real nested object (safe dotted access). field is a real ns object,
// so `field.time_hub` as a nested literal is safe. settings is a real ns object too.
(resources.en as any).common.nav.time = 'Time';
(resources.es as any).common.nav.time = 'Tiempo';

(resources.en as any).field.time_hub = {
  clocked_in: 'CLOCKED IN',
  add_hours: 'Add Hours',
  this_week: 'This Week',
  week_total: '{{hours}} h',
  today_entries: "Today's Entries",
  select_project: 'Select project',
  project: 'Project',
  project_optional: 'Project (optional)',
  no_project: 'No project',
  project_required: 'Please select a project.',
  hours_required: 'Enter hours greater than zero.',
  week_logged: '{{count}} day(s) logged',
  tab_day: 'Single Day',
  tab_week: 'Whole Week',
  hours_per_day: 'Hours per day',
};
(resources.es as any).field.time_hub = {
  clocked_in: 'FICHADO',
  add_hours: 'Agregar Horas',
  this_week: 'Esta Semana',
  week_total: '{{hours}} h',
  today_entries: 'Registros de Hoy',
  select_project: 'Seleccionar proyecto',
  project: 'Proyecto',
  project_optional: 'Proyecto (opcional)',
  no_project: 'Sin proyecto',
  project_required: 'Seleccione un proyecto.',
  hours_required: 'Ingrese horas mayores que cero.',
  week_logged: '{{count}} día(s) registrados',
  tab_day: 'Un Día',
  tab_week: 'Semana Completa',
  hours_per_day: 'Horas por día',
};

(resources.en as any).settings.time_tracking = 'Time Tracking';
(resources.en as any).settings.mode_manual = 'Manual Hours';
(resources.en as any).settings.mode_clock = 'Clock In / Out';
(resources.en as any).settings.mode_hint = 'Choose how your team records time. Manual: workers enter hours per day. Clock in/out: workers punch in and out.';
(resources.es as any).settings.time_tracking = 'Control de Tiempo';
(resources.es as any).settings.mode_manual = 'Horas Manuales';
(resources.es as any).settings.mode_clock = 'Entrada / Salida';
(resources.es as any).settings.mode_hint = 'Elija cómo su equipo registra el tiempo. Manual: los trabajadores ingresan horas por día. Entrada/salida: los trabajadores fichan entrada y salida.';

// Clock punch add/edit (enterprise multiple timestamps) — field.punch.*
(resources.en as any).field.punch = {
  add_short: 'Add time',
  none_today: 'No punches today yet.',
  add_title: 'Add Time',
  edit_title: 'Edit Punch',
  start: 'Start',
  end: 'End',
  duration: '{{hours}} h',
  end_after_start: 'End time must be after start time.',
  delete: 'Delete punch',
  delete_title: 'Delete punch',
  delete_confirm: 'Remove this punch? The day total will update.',
};
(resources.es as any).field.punch = {
  add_short: 'Agregar',
  none_today: 'Aún no hay fichajes hoy.',
  add_title: 'Agregar Tiempo',
  edit_title: 'Editar Fichaje',
  start: 'Inicio',
  end: 'Fin',
  duration: '{{hours}} h',
  end_after_start: 'La hora de fin debe ser posterior a la de inicio.',
  delete: 'Eliminar fichaje',
  delete_title: 'Eliminar fichaje',
  delete_confirm: '¿Eliminar este fichaje? El total del día se actualizará.',
};

// ── Near-me project map (Doc 20 Phase 4) — new top-level namespaces (safe: parent = resources.en/es) ──
(resources.en as any).nearme = {
  all: 'All',
  miles: '{{count}} mi',
  map_view: 'Map',
  list_view: 'List',
  loading: 'Finding nearby projects…',
  empty: 'No projects with a location',
  empty_hint: 'Projects appear here once they have an address on file.',
  empty_radius_hint: 'Nothing in this radius — widen it or choose All.',
  offline_cached: 'Offline — showing last known project locations.',
  no_gps: 'Location unavailable — projects shown unsorted.',
  away: '{{miles}} mi away',
  approximate: 'approx. location',
  directions: 'Directions',
};
(resources.es as any).nearme = {
  all: 'Todos',
  miles: '{{count}} mi',
  map_view: 'Mapa',
  list_view: 'Lista',
  loading: 'Buscando proyectos cercanos…',
  empty: 'No hay proyectos con ubicación',
  empty_hint: 'Los proyectos aparecen aquí cuando tienen una dirección registrada.',
  empty_radius_hint: 'Nada en este radio — amplíelo o elija Todos.',
  offline_cached: 'Sin conexión — mostrando las últimas ubicaciones conocidas.',
  no_gps: 'Ubicación no disponible — proyectos sin ordenar.',
  away: 'a {{miles}} mi',
  approximate: 'ubicación aprox.',
  directions: 'Cómo llegar',
};
(resources.en as any).common.nav.map = 'Map';
(resources.es as any).common.nav.map = 'Mapa';

// JSA (job safety analysis) — chrome only. ⚠️ T-08: hazard/control CONTENT is
// safety-critical and is user data, never machine-translated; these are field labels.
(resources.en as any).jsa = {
  suggest_hazards: 'Suggest hazards for this day',
  suggest_loading: 'Loading suggestions…',
  suggest_failed: 'Could not load suggestions.',
  suggest_no_trades: 'No trades are scheduled on this day.',
  suggest_none: 'No hazard suggestions for these trades yet.',
  suggest_cached: 'Offline — showing the last saved suggestions.',
  suggest_add: 'Add',
  suggest_added: 'Added',
  es_pending: 'English only',
  from_trade_pack: 'from trade safety library',
  empty: 'No JSAs yet',
  new_button: '+ New JSA',
  modal_title: 'New JSA',
  title_label: 'Task / Activity',
  title_placeholder: 'e.g. Roof edge work — south slope',
  conducted_at: 'Date conducted',
  attendees: 'Attendees',
  attendee_placeholder: 'Worker name',
  attendee_count: '{{count}} attendees',
  hazards: 'Hazards',
  hazard_placeholder: 'Hazard identified',
  controls: 'Controls',
  controls_placeholder: 'Control measure',
  hazard_count: '{{count}} hazards',
  add: 'Add',
  add_hazard: 'Add hazard',
  required: 'Required',
  error_title_required: 'Enter the task or activity.',
  error_hazard_required: 'Add at least one hazard — a JSA with none is just a signature sheet.',
  error_title: 'Error',
  error_submit_failed: 'Could not save. Try again.',
  cancel: 'Cancel',
  submit: 'Create',
  submitting: 'Saving…',
  severity: { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' },
};
(resources.es as any).jsa = {
  suggest_hazards: 'Sugerir riesgos para este día',
  suggest_loading: 'Cargando sugerencias…',
  suggest_failed: 'No se pudieron cargar las sugerencias.',
  suggest_no_trades: 'No hay oficios programados este día.',
  suggest_none: 'Aún no hay sugerencias de riesgos para estos oficios.',
  suggest_cached: 'Sin conexión — mostrando las últimas sugerencias guardadas.',
  suggest_add: 'Agregar',
  suggest_added: 'Agregado',
  es_pending: 'Solo en inglés',
  from_trade_pack: 'de la biblioteca de seguridad del oficio',
  empty: 'Aún no hay ATS',
  new_button: '+ Nuevo ATS',
  modal_title: 'Nuevo ATS',
  title_label: 'Tarea / Actividad',
  title_placeholder: 'ej. Trabajo en borde de techo — ladera sur',
  conducted_at: 'Fecha realizada',
  attendees: 'Asistentes',
  attendee_placeholder: 'Nombre del trabajador',
  attendee_count: '{{count}} asistentes',
  hazards: 'Peligros',
  hazard_placeholder: 'Peligro identificado',
  controls: 'Controles',
  controls_placeholder: 'Medida de control',
  hazard_count: '{{count}} peligros',
  add: 'Agregar',
  add_hazard: 'Agregar peligro',
  required: 'Requerido',
  error_title_required: 'Ingrese la tarea o actividad.',
  error_hazard_required: 'Agregue al menos un peligro — un ATS sin peligros es solo una hoja de firmas.',
  error_title: 'Error',
  error_submit_failed: 'No se pudo guardar. Intente de nuevo.',
  cancel: 'Cancelar',
  submit: 'Crear',
  submitting: 'Guardando…',
  severity: { low: 'Bajo', medium: 'Medio', high: 'Alto', critical: 'Crítico' },
};
(resources.en as any).projects['actions.jsa'] = 'JSA';
(resources.es as any).projects['actions.jsa'] = 'ATS';
(resources.en as any).common.nav.jsa = 'JSA';
(resources.es as any).common.nav.jsa = 'ATS';

(resources.en as any).structural.new_test = '+ New Test';
(resources.en as any).structural.no_tests = 'No QA tests yet';
(resources.en as any).structural.qa_tests = '🧪 QA tests';
(resources.en as any).structural.test_type = 'Test Type';
(resources.en as any).structural.test_slump = 'Slump';
(resources.en as any).structural.test_air_content = 'Air';
(resources.en as any).structural.test_temperature = 'Temp';
(resources.en as any).structural.test_cylinder_compressive = 'Cylinder';
(resources.en as any).structural.test_other = 'Other';
(resources.en as any).structural.measured = 'Measured';
(resources.en as any).structural.specified = 'spec';
(resources.en as any).structural.specified_optional = 'Specified (optional)';
(resources.en as any).structural.age_days = 'Age (days)';
(resources.en as any).structural.age_days_short = '{{days}}d';
(resources.en as any).structural.sample_id = 'Sample ID';
(resources.en as any).structural.sample_placeholder = 'e.g. CYL-14';
(resources.en as any).structural.result_pass = 'PASS';
(resources.en as any).structural.result_fail = 'FAIL';
(resources.en as any).structural.result_pending = 'PENDING';
(resources.en as any).structural.required = 'Required';
(resources.en as any).structural.error_measured_required = 'Enter the measured value.';
(resources.en as any).structural.error_title = 'Error';
(resources.en as any).structural.error_submit_failed = 'Could not save. Try again.';
(resources.en as any).structural.cancel = 'Cancel';
(resources.en as any).structural.submit = 'Save';
(resources.en as any).structural.submitting = 'Saving…';
(resources.es as any).structural.new_test = '+ Nueva Prueba';
(resources.es as any).structural.no_tests = 'Aún no hay pruebas de calidad';
(resources.es as any).structural.qa_tests = '🧪 Pruebas';
(resources.es as any).structural.test_type = 'Tipo de Prueba';
(resources.es as any).structural.test_slump = 'Revenimiento';
(resources.es as any).structural.test_air_content = 'Aire';
(resources.es as any).structural.test_temperature = 'Temp';
(resources.es as any).structural.test_cylinder_compressive = 'Cilindro';
(resources.es as any).structural.test_other = 'Otro';
(resources.es as any).structural.measured = 'Medido';
(resources.es as any).structural.specified = 'esp';
(resources.es as any).structural.specified_optional = 'Especificado (opcional)';
(resources.es as any).structural.age_days = 'Edad (días)';
(resources.es as any).structural.age_days_short = '{{days}}d';
(resources.es as any).structural.sample_id = 'ID de Muestra';
(resources.es as any).structural.sample_placeholder = 'ej. CYL-14';
(resources.es as any).structural.result_pass = 'APROBADO';
(resources.es as any).structural.result_fail = 'FALLÓ';
(resources.es as any).structural.result_pending = 'PENDIENTE';
(resources.es as any).structural.required = 'Requerido';
(resources.es as any).structural.error_measured_required = 'Ingrese el valor medido.';
(resources.es as any).structural.error_title = 'Error';
(resources.es as any).structural.error_submit_failed = 'No se pudo guardar. Intente de nuevo.';
(resources.es as any).structural.cancel = 'Cancelar';
(resources.es as any).structural.submit = 'Guardar';
(resources.es as any).structural.submitting = 'Guardando…';

(resources.en as any).structural.qa_checks = '🏠 QA checks';
(resources.en as any).structural.no_checks = 'No QA checks yet';
(resources.en as any).structural.new_check = '+ New Check';
(resources.en as any).structural.check_type = 'Check Type';
(resources.en as any).structural.qa_deck = 'Deck';
(resources.en as any).structural.qa_underlayment_dry_in = 'Dry-in';
(resources.en as any).structural.qa_flashing = 'Flashing';
(resources.en as any).structural.qa_seam_weld = 'Seam weld';
(resources.en as any).structural.qa_fastener_pull = 'Fastener pull';
(resources.en as any).structural.qa_water_test = 'Water test';
(resources.en as any).structural.qa_final = 'Final';
(resources.en as any).structural.result_label = 'Result';
(resources.en as any).structural.pull_value = 'Pull-out (lbf)';
(resources.en as any).structural.corrections = '🪵 Corrections';
(resources.en as any).structural.no_corrections = 'No corrections';
(resources.en as any).structural.new_correction = '+ New Correction';
(resources.en as any).structural.correction_description = 'What needs fixing';
(resources.en as any).structural.correction_placeholder = 'e.g. Missing hurricane tie';
(resources.en as any).structural.correction_location = 'Location';
(resources.en as any).structural.location_placeholder = 'e.g. NW corner, bedroom 2';
(resources.en as any).structural.correction_severity = 'Severity';
(resources.en as any).structural.set_status = 'Set status';
(resources.en as any).structural.cor_status_open = 'OPEN';
(resources.en as any).structural.cor_status_in_progress = 'IN PROGRESS';
(resources.en as any).structural.cor_status_resolved = 'RESOLVED';
(resources.en as any).structural.cor_severity_minor = 'Minor';
(resources.en as any).structural.cor_severity_major = 'Major';
(resources.en as any).structural.cor_severity_safety = 'Safety';
(resources.en as any).structural.error_description_required = 'Describe what needs fixing.';
(resources.es as any).structural.qa_checks = '🏠 Inspecciones';
(resources.es as any).structural.no_checks = 'Aún no hay inspecciones';
(resources.es as any).structural.new_check = '+ Nueva Inspección';
(resources.es as any).structural.check_type = 'Tipo';
(resources.es as any).structural.qa_deck = 'Cubierta';
(resources.es as any).structural.qa_underlayment_dry_in = 'Impermeabilización';
(resources.es as any).structural.qa_flashing = 'Tapajuntas';
(resources.es as any).structural.qa_seam_weld = 'Soldadura';
(resources.es as any).structural.qa_fastener_pull = 'Extracción de sujetador';
(resources.es as any).structural.qa_water_test = 'Prueba de agua';
(resources.es as any).structural.qa_final = 'Final';
(resources.es as any).structural.result_label = 'Resultado';
(resources.es as any).structural.pull_value = 'Extracción (lbf)';
(resources.es as any).structural.corrections = '🪵 Correcciones';
(resources.es as any).structural.no_corrections = 'Sin correcciones';
(resources.es as any).structural.new_correction = '+ Nueva Corrección';
(resources.es as any).structural.correction_description = 'Qué se debe corregir';
(resources.es as any).structural.correction_placeholder = 'ej. Falta amarre de huracán';
(resources.es as any).structural.correction_location = 'Ubicación';
(resources.es as any).structural.location_placeholder = 'ej. Esquina NO, recámara 2';
(resources.es as any).structural.correction_severity = 'Severidad';
(resources.es as any).structural.set_status = 'Cambiar estado';
(resources.es as any).structural.cor_status_open = 'ABIERTO';
(resources.es as any).structural.cor_status_in_progress = 'EN PROCESO';
(resources.es as any).structural.cor_status_resolved = 'RESUELTO';
(resources.es as any).structural.cor_severity_minor = 'Menor';
(resources.es as any).structural.cor_severity_major = 'Mayor';
(resources.es as any).structural.cor_severity_safety = 'Seguridad';
(resources.es as any).structural.error_description_required = 'Describa qué se debe corregir.';

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  ns: ['common', 'projects', 'field', 'safety', 'rfi', 'documents', 'notifications', 'trade-electrical', 'trade-plumbing', 'warranties', 'permits', 'structural', 'tasks', 'settings', 'inspections', 'safety_certs', 'jsa', 'whatsnew', 'nearme', 'connections'],
  defaultNS: 'common',
});

/** Switch the active UI language at runtime (T-09: saved pref → device → 'en'). */
export function applyLanguage(lang: string | undefined): void {
  const next = lang === 'es' ? 'es' : 'en';
  if (i18n.language !== next) void i18n.changeLanguage(next);
}

export default i18n;

export const fr = {
  // Common
  common: {
    success: 'Succès',
    error: 'Erreur',
    notFound: 'Non trouvé',
    unauthorized: 'Non autorisé',
    forbidden: 'Interdit',
    badRequest: 'Requête invalide',
    internalServerError: 'Erreur interne du serveur',
    created: 'Créé avec succès',
    updated: 'Mis à jour avec succès',
    deleted: 'Supprimé avec succès',
    invalidRequest: 'Requête invalide',
    missingParameters: 'Paramètres requis manquants',
    invalidParameters: 'Paramètres invalides',
    dataNotFound: 'Données non trouvées',
    accessDenied: 'Accès refusé',
    serverError: 'Erreur serveur',
    validationError: 'Erreur de validation',
    healthy: 'En bonne santé',
    running: 'En cours d\'exécution',
    teamCalendarAPI: 'API du Calendrier d\'Équipe',
  },

  // Auth
  auth: {
    loginSuccess: 'Connexion réussie',
    loginFailed: 'Échec de la connexion',
    invalidCredentials: 'Identifiants invalides',
    registrationSuccess: 'Inscription réussie',
    registrationFailed: 'Échec de l\'inscription',
    emailAlreadyExists: 'L\'email existe déjà',
    invalidToken: 'Jeton invalide ou expiré',
    accessTokenRequired: 'Jeton d\'accès requis',
    notAuthorized: 'Non autorisé à effectuer cette action',
    userNotFound: 'Utilisateur non trouvé ou accès refusé',
    passwordRequired: 'Le mot de passe est requis',
    emailRequired: 'L\'email est requis',
    siteRequired: 'Le site est requis',
  },

  // Users
  users: {
    userCreated: 'Utilisateur créé avec succès',
    userUpdated: 'Utilisateur mis à jour avec succès',
    userDeleted: 'Utilisateur supprimé avec succès',
    userNotFound: 'Utilisateur non trouvé',
    cannotDeleteLastAdmin: 'Impossible de supprimer le dernier administrateur',
    emailAlreadyInUse: 'L\'email est déjà utilisé',
    invalidRole: 'Rôle invalide',
    invalidStatus: 'Statut invalide',
    failedToFetchUsers: 'Échec de la récupération des utilisateurs',
    failedToCreateUser: 'Échec de la création de l\'utilisateur',
    failedToUpdateUser: 'Échec de la mise à jour de l\'utilisateur',
    failedToDeleteUser: 'Échec de la suppression de l\'utilisateur',
    userSettingsUpdated: 'Paramètres utilisateur mis à jour avec succès',
    availabilityUpdated: 'Disponibilité mise à jour avec succès',
    exceptionUpdated: 'Exception mise à jour avec succès',
  },

  // Events
  events: {
    eventCreated: 'Événement créé avec succès',
    eventUpdated: 'Événement mis à jour avec succès',
    eventDeleted: 'Événement supprimé avec succès',
    eventNotFound: 'Événement non trouvé',
    failedToFetchEvents: 'Échec de la récupération des événements',
    failedToCreateEvent: 'Échec de la création de l\'événement',
    failedToUpdateEvent: 'Échec de la mise à jour de l\'événement',
    failedToDeleteEvent: 'Échec de la suppression de l\'événement',
    notAuthorizedToModifyEvent: 'Non autorisé à modifier cet événement',
    invalidEventType: 'Type d\'événement invalide',
    invalidEventDate: 'Date d\'événement invalide',
    invalidEventStatus: 'Statut d\'événement invalide',
    eventStatusUpdated: 'Statut de l\'événement mis à jour avec succès',
    bulkUpdateSuccess: '{{count}} événements mis à jour',
    holiday: 'Congé ({{status}})',
  },

  // Holidays
  holidays: {
    holidaysNotFound: 'Aucun jour férié trouvé pour l\'année {{year}} et l\'emplacement {{location}}',
    failedToFetchHolidays: 'Échec de la récupération des jours fériés',
  },

  // Periods
  periods: {
    periodsSaved: 'Périodes enregistrées avec succès',
    periodsReset: 'Périodes réinitialisées aux valeurs par défaut',
    failedToFetchPeriods: 'Échec de la récupération des périodes',
    failedToSavePeriods: 'Échec de l\'enregistrement des périodes',
    failedToResetPeriods: 'Échec de la réinitialisation des périodes',
    invalidYear: 'Année invalide',
    invalidPeriodData: 'Données de période invalides',
    allPeriodFieldsRequired: 'Tous les champs de période sont requis',
    invalidDateFormat: 'Format de date invalide',
    endDateMustBeAfterStart: 'Période "{{name}}": La date de fin doit être postérieure à la date de début',
    periodsOverlap: 'Les périodes "{{period1}}" et "{{period2}}" ont des dates qui se chevauchent',
    adminAccessRequired: 'Accès administrateur requis',
  },

  // Availability
  availability: {
    scheduleNotFound: 'Planning non trouvé',
    failedToFetchSchedules: 'Échec de la récupération des plannings',
    failedToCreateSchedule: 'Échec de la création du planning',
    failedToUpdateSchedule: 'Échec de la mise à jour du planning',
    failedToDeleteSchedule: 'Échec de la suppression du planning',
    validationError: 'Erreur de validation dans les données du planning',
    availabilityUpdated: 'Disponibilité mise à jour avec succès',
    failedToGenerateReport: 'Échec de la génération du rapport de disponibilité',
  },

  // On-duty
  onDuty: {
    noOnDutyStaffFound: 'Aucun personnel de garde trouvé pour la date spécifiée: {{date}}',
    onDutyScheduleNotFound: 'Planning de garde non trouvé',
    onDutyUserNotFound: 'Utilisateur de garde non trouvé',
    failedToFetchOnDutyStaff: 'Échec de la récupération du personnel de garde',
    invalidDateFormat: 'Format de date invalide',
    onDutyShift: 'Garde',
    onDutyShiftDescription: 'Garde pour {{firstName}} {{lastName}}',
  },

  // Export
  export: {
    failedToExportEvents: 'Échec de l\'exportation des événements',
    failedToExportUserEvents: 'Échec de l\'exportation des événements utilisateur',
  },

  // Subscription
  subscription: {
    failedToGenerateSubscriptionURL: 'Échec de la génération de l\'URL d\'abonnement',
    invalidSubscriptionToken: 'Jeton d\'abonnement invalide',
    userNotFound: 'Utilisateur non trouvé',
    failedToServeCalendar: 'Échec de la diffusion du calendrier',
    failedToFetchAgenda: 'Échec de la récupération de l\'agenda',
    subscriptionInstructions: 'Pour vous abonner à ce calendrier, copiez l\'URL et ajoutez-la à votre application de calendrier en tant que calendrier d\'abonnement.',
  },

  // Health
  health: {
    status: 'en bonne santé',
    teamCalendarAPI: 'API du Calendrier d\'Équipe',
    uptime: 'Temps de fonctionnement',
    environment: 'Environnement',
    version: 'Version',
  },
};
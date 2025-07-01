export const nl = {
  // Common
  common: {
    success: 'Succes',
    error: 'Fout',
    notFound: 'Niet gevonden',
    unauthorized: 'Niet geautoriseerd',
    forbidden: 'Verboden',
    badRequest: 'Ongeldige aanvraag',
    internalServerError: 'Interne serverfout',
    created: 'Succesvol aangemaakt',
    updated: 'Succesvol bijgewerkt',
    deleted: 'Succesvol verwijderd',
    invalidRequest: 'Ongeldige aanvraag',
    missingParameters: 'Ontbrekende verplichte parameters',
    invalidParameters: 'Ongeldige parameters',
    dataNotFound: 'Gegevens niet gevonden',
    accessDenied: 'Toegang geweigerd',
    serverError: 'Serverfout',
    validationError: 'Validatiefout',
    healthy: 'Gezond',
    running: 'Actief',
    teamCalendarAPI: 'Team Kalender API',
  },

  // Auth
  auth: {
    loginSuccess: 'Inloggen succesvol',
    loginFailed: 'Inloggen mislukt',
    invalidCredentials: 'Ongeldige inloggegevens',
    registrationSuccess: 'Registratie succesvol',
    registrationFailed: 'Registratie mislukt',
    emailAlreadyExists: 'E-mail bestaat al',
    invalidToken: 'Ongeldig of verlopen token',
    accessTokenRequired: 'Toegangstoken vereist',
    notAuthorized: 'Niet geautoriseerd om deze actie uit te voeren',
    userNotFound: 'Gebruiker niet gevonden of toegang geweigerd',
    passwordRequired: 'Wachtwoord is vereist',
    emailRequired: 'E-mail is vereist',
    siteRequired: 'Site is vereist',
  },

  // Users
  users: {
    userCreated: 'Gebruiker succesvol aangemaakt',
    userUpdated: 'Gebruiker succesvol bijgewerkt',
    userDeleted: 'Gebruiker succesvol verwijderd',
    userNotFound: 'Gebruiker niet gevonden',
    cannotDeleteLastAdmin: 'Kan de laatste beheerder niet verwijderen',
    emailAlreadyInUse: 'E-mail is al in gebruik',
    invalidRole: 'Ongeldige rol',
    invalidStatus: 'Ongeldige status',
    failedToFetchUsers: 'Ophalen van gebruikers mislukt',
    failedToCreateUser: 'Aanmaken van gebruiker mislukt',
    failedToUpdateUser: 'Bijwerken van gebruiker mislukt',
    failedToDeleteUser: 'Verwijderen van gebruiker mislukt',
    userSettingsUpdated: 'Gebruikersinstellingen succesvol bijgewerkt',
    availabilityUpdated: 'Beschikbaarheid succesvol bijgewerkt',
    exceptionUpdated: 'Uitzondering succesvol bijgewerkt',
  },

  // Events
  events: {
    eventCreated: 'Gebeurtenis succesvol aangemaakt',
    eventUpdated: 'Gebeurtenis succesvol bijgewerkt',
    eventDeleted: 'Gebeurtenis succesvol verwijderd',
    eventNotFound: 'Gebeurtenis niet gevonden',
    failedToFetchEvents: 'Ophalen van gebeurtenissen mislukt',
    failedToCreateEvent: 'Aanmaken van gebeurtenis mislukt',
    failedToUpdateEvent: 'Bijwerken van gebeurtenis mislukt',
    failedToDeleteEvent: 'Verwijderen van gebeurtenis mislukt',
    notAuthorizedToModifyEvent: 'Niet geautoriseerd om deze gebeurtenis te wijzigen',
    invalidEventType: 'Ongeldig gebeurtenistype',
    invalidEventDate: 'Ongeldige gebeurtenisdatum',
    invalidEventStatus: 'Ongeldige gebeurtenisstatus',
    eventStatusUpdated: 'Gebeurtenisstatus succesvol bijgewerkt',
    bulkUpdateSuccess: '{{count}} gebeurtenissen bijgewerkt',
    holiday: 'Verlof ({{status}})',
  },

  // Holidays
  holidays: {
    holidaysNotFound: 'Geen feestdagen gevonden voor jaar {{year}} en locatie {{location}}',
    failedToFetchHolidays: 'Ophalen van feestdagen mislukt',
  },

  // Periods
  periods: {
    periodsSaved: 'Periodes succesvol opgeslagen',
    periodsReset: 'Periodes teruggezet naar standaardwaarden',
    failedToFetchPeriods: 'Ophalen van periodes mislukt',
    failedToSavePeriods: 'Opslaan van periodes mislukt',
    failedToResetPeriods: 'Terugzetten van periodes mislukt',
    invalidYear: 'Ongeldig jaar',
    invalidPeriodData: 'Ongeldige periodegegevens',
    allPeriodFieldsRequired: 'Alle periodevelden zijn vereist',
    invalidDateFormat: 'Ongeldig datumformaat',
    endDateMustBeAfterStart: 'Periode "{{name}}": Einddatum moet na startdatum liggen',
    periodsOverlap: 'Periodes "{{period1}}" en "{{period2}}" hebben overlappende datums',
    adminAccessRequired: 'Beheerderstoegang vereist',
  },

  // Availability
  availability: {
    scheduleNotFound: 'Schema niet gevonden',
    failedToFetchSchedules: 'Ophalen van schema\'s mislukt',
    failedToCreateSchedule: 'Aanmaken van schema mislukt',
    failedToUpdateSchedule: 'Bijwerken van schema mislukt',
    failedToDeleteSchedule: 'Verwijderen van schema mislukt',
    validationError: 'Validatiefout in schemagegevens',
    availabilityUpdated: 'Beschikbaarheid succesvol bijgewerkt',
    failedToGenerateReport: 'Genereren van beschikbaarheidsrapport mislukt',
  },

  // On-duty
  onDuty: {
    noOnDutyStaffFound: 'Geen dienstdoende medewerker gevonden voor de opgegeven datum: {{date}}',
    onDutyScheduleNotFound: 'Dienstrooster niet gevonden',
    onDutyUserNotFound: 'Dienstdoende gebruiker niet gevonden',
    failedToFetchOnDutyStaff: 'Ophalen van dienstdoende medewerker mislukt',
    invalidDateFormat: 'Ongeldig datumformaat',
    onDutyShift: 'Van wacht',
    onDutyShiftDescription: 'Dienstdoende shift voor {{firstName}} {{lastName}}',
  },

  // Export
  export: {
    failedToExportEvents: 'Exporteren van gebeurtenissen mislukt',
    failedToExportUserEvents: 'Exporteren van gebruikersgebeurtenissen mislukt',
  },

  // Subscription
  subscription: {
    failedToGenerateSubscriptionURL: 'Genereren van abonnements-URL mislukt',
    invalidSubscriptionToken: 'Ongeldig abonnementstoken',
    userNotFound: 'Gebruiker niet gevonden',
    failedToServeCalendar: 'Serveren van kalender mislukt',
    failedToFetchAgenda: 'Ophalen van agenda mislukt',
    subscriptionInstructions: 'Om je te abonneren op deze kalender, kopieer de URL en voeg deze toe aan je kalender-applicatie als een abonnementskalender.',
  },

  // Health
  health: {
    status: 'gezond',
    teamCalendarAPI: 'Team Kalender API',
    uptime: 'Uptime',
    environment: 'Omgeving',
    version: 'Versie',
  },
};
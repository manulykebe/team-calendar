export const en = {
  // Common
  common: {
    success: 'Success',
    error: 'Error',
    notFound: 'Not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    badRequest: 'Bad request',
    internalServerError: 'Internal server error',
    created: 'Created successfully',
    updated: 'Updated successfully',
    deleted: 'Deleted successfully',
    invalidRequest: 'Invalid request',
    missingParameters: 'Missing required parameters',
    invalidParameters: 'Invalid parameters',
    dataNotFound: 'Data not found',
    accessDenied: 'Access denied',
    serverError: 'Server error',
    validationError: 'Validation error',
    healthy: 'Healthy',
    running: 'Running',
    teamCalendarAPI: 'Team Calendar API',
  },

  // Auth
  auth: {
    loginSuccess: 'Login successful',
    loginFailed: 'Login failed',
    invalidCredentials: 'Invalid credentials',
    registrationSuccess: 'Registration successful',
    registrationFailed: 'Registration failed',
    emailAlreadyExists: 'Email already exists',
    invalidToken: 'Invalid or expired token',
    accessTokenRequired: 'Access token required',
    notAuthorized: 'Not authorized to perform this action',
    userNotFound: 'User not found or access denied',
    passwordRequired: 'Password is required',
    emailRequired: 'Email is required',
    siteRequired: 'Site is required',
  },

  // Users
  users: {
    userCreated: 'User created successfully',
    userUpdated: 'User updated successfully',
    userDeleted: 'User deleted successfully',
    userNotFound: 'User not found',
    cannotDeleteLastAdmin: 'Cannot delete the last admin user',
    emailAlreadyInUse: 'Email is already in use',
    invalidRole: 'Invalid role',
    invalidStatus: 'Invalid status',
    failedToFetchUsers: 'Failed to fetch users',
    failedToCreateUser: 'Failed to create user',
    failedToUpdateUser: 'Failed to update user',
    failedToDeleteUser: 'Failed to delete user',
    userSettingsUpdated: 'User settings updated successfully',
    availabilityUpdated: 'Availability updated successfully',
    exceptionUpdated: 'Exception updated successfully',
  },

  // Events
  events: {
    eventCreated: 'Event created successfully',
    eventUpdated: 'Event updated successfully',
    eventDeleted: 'Event deleted successfully',
    eventNotFound: 'Event not found',
    failedToFetchEvents: 'Failed to fetch events',
    failedToCreateEvent: 'Failed to create event',
    failedToUpdateEvent: 'Failed to update event',
    failedToDeleteEvent: 'Failed to delete event',
    notAuthorizedToModifyEvent: 'Not authorized to modify this event',
    invalidEventType: 'Invalid event type',
    invalidEventDate: 'Invalid event date',
    invalidEventStatus: 'Invalid event status',
    eventStatusUpdated: 'Event status updated successfully',
    bulkUpdateSuccess: 'Updated {{count}} events',
    holiday: 'Banking Holiday ({{status}})',
  },

  // Holidays
  holidays: {
    holidaysNotFound: 'No holidays found for year {{year}} and location {{location}}',
    failedToFetchHolidays: 'Failed to fetch holidays',
  },

  // Periods
  periods: {
    periodsSaved: 'Periods saved successfully',
    periodsReset: 'Periods reset to defaults',
    failedToFetchPeriods: 'Failed to fetch periods',
    failedToSavePeriods: 'Failed to save periods',
    failedToResetPeriods: 'Failed to reset periods',
    invalidYear: 'Invalid year',
    invalidPeriodData: 'Invalid period data',
    allPeriodFieldsRequired: 'All period fields are required',
    invalidDateFormat: 'Invalid date format',
    endDateMustBeAfterStart: 'Period "{{name}}": End date must be after start date',
    periodsOverlap: 'Periods "{{period1}}" and "{{period2}}" have overlapping dates',
    adminAccessRequired: 'Admin access required',
  },

  // Availability
  availability: {
    scheduleNotFound: 'Schedule not found',
    failedToFetchSchedules: 'Failed to fetch schedules',
    failedToCreateSchedule: 'Failed to create schedule',
    failedToUpdateSchedule: 'Failed to update schedule',
    failedToDeleteSchedule: 'Failed to delete schedule',
    validationError: 'Validation error in schedule data',
    availabilityUpdated: 'Availability updated successfully',
    failedToGenerateReport: 'Failed to generate availability report',
  },

  // On-duty
  onDuty: {
    noOnDutyStaffFound: 'No on-duty staff found for the specified date: {{date}}',
    onDutyScheduleNotFound: 'On-duty schedule not found',
    onDutyUserNotFound: 'On-duty user not found',
    failedToFetchOnDutyStaff: 'Failed to fetch on-duty staff',
    invalidDateFormat: 'Invalid date format',
    onDutyShift: 'On Duty Shift',
    onDutyShiftDescription: 'On-call duty shift for {{firstName}} {{lastName}}',
  },

  // Export
  export: {
    failedToExportEvents: 'Failed to export events',
    failedToExportUserEvents: 'Failed to export user events',
  },

  // Subscription
  subscription: {
    failedToGenerateSubscriptionURL: 'Failed to generate subscription URL',
    invalidSubscriptionToken: 'Invalid subscription token',
    userNotFound: 'User not found',
    failedToServeCalendar: 'Failed to serve calendar',
    failedToFetchAgenda: 'Failed to fetch agenda',
    subscriptionInstructions: 'To subscribe to this calendar, copy the URL and add it to your calendar application as a subscription calendar.',
  },

  // Health
  health: {
    status: 'healthy',
    teamCalendarAPI: 'Team Calendar API',
    uptime: 'Uptime',
    environment: 'Environment',
    version: 'Version',
  },
};
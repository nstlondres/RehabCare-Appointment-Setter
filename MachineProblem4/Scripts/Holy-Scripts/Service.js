app.service("UserAccountService", function ($http) {

    // AUTH
    this.registerService = function (userData) {
        return $http.post("/UserAccount/Register", userData);
    };

    this.loginService = function (credentials) {
        return $http.post("/UserAccount/Login", credentials);
    };

    this.updateProfileService = function (profileData) {
        return $http.post("/UserAccount/UpdateProfile", profileData);
    };

    this.getPatientAppointmentsService = function (patientId) {
        return $http.get("/UserAccount/GetPatientAppointments", {
            params: { PatientId: patientId }
        });
    };

    // DASHBOARD
    this.getDashboardStatsService = function () {
        return $http.get("/UserAccount/GetDashboardStats");
    };

    this.getTherapyAppointmentChartService = function () {
        return $http.get("/UserAccount/GetTherapyAppointmentChart");
    };

    this.getAppointmentStatusChartService = function () {
        return $http.get("/UserAccount/GetAppointmentStatusChart");
    };

    this.getWeeklyRevenueChartService = function () {
        return $http.get("/UserAccount/GetWeeklyRevenueChart");
    };

    // PATIENTS
    this.getPatientsService = function () {
        return $http.get("/UserAccount/GetPatients");
    };

    this.updatePatientService = function (patientData) {
        return $http.post("/UserAccount/UpdatePatient", patientData);
    };

    this.deletePatientService = function (patientId) {
        return $http.post("/UserAccount/DeletePatient", { PatientId: patientId });
    };

    // APPOINTMENTS
    this.bookAppointmentService = function (formData) {
        return $http.post("/UserAccount/BookAppointment", formData, {
            transformRequest: angular.identity,
            headers: { "Content-Type": undefined }
        });
    };

    this.getAppointmentsService = function () {
        return $http.get("/UserAccount/GetAppointments");
    };

    this.updateAppointmentService = function (appointmentData) {
        return $http.post("/UserAccount/UpdateAppointment", appointmentData);
    };

    this.deleteAppointmentService = function (appointmentId) {
        return $http.post("/UserAccount/DeleteAppointment", { AppointmentId: appointmentId });
    };

    // THERAPISTS
    this.getTherapistsService = function () {
        return $http.get("/UserAccount/GetTherapists");
    };

    this.saveTherapistService = function (therapistData) {
        return $http.post("/UserAccount/SaveTherapist", therapistData);
    };

    this.deleteTherapistService = function (therapistId) {
        return $http.post("/UserAccount/DeleteTherapist", { TherapistId: therapistId });
    };

    this.getAvailableTherapistsCountService = function () {
        return $http.get("/UserAccount/GetAvailableTherapistsCount");
    };

    // PAYMENTS
    this.getPaymentsService = function () {
        return $http.get("/UserAccount/GetPayments");
    };

    this.updatePaymentStatusService = function (paymentId, paymentStatus) {
        return $http.post("/UserAccount/UpdatePaymentStatus", {
            PaymentId: paymentId,
            PaymentStatus: paymentStatus
        });
    };
});

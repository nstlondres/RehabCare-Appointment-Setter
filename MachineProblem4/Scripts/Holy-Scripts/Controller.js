app.controller("UserAccountController", function ($scope, $http, $sce, $timeout, UserAccountService) {
    $scope.newArray = [];
    $scope.editIndex = -1;
    $scope.showLogin = false;
    $scope.errors = {};
    $scope.pwChecks = {
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false
    };

    var today = new Date();
    $scope.maxDate = today.toISOString().split("T")[0];

    window.addEventListener("pageshow", function (event) {
        if (event.persisted) {
            window.location.reload();
        }
    });

    function getDateOnly(val) {
        if (!val) return "";
        var d = (val instanceof Date) ? val : new Date(val);
        if (isNaN(d.getTime())) return (val + "").substring(0, 10);
        var y = d.getUTCFullYear();
        var m = String(d.getUTCMonth() + 1).padStart(2, "0");
        var day = String(d.getUTCDate()).padStart(2, "0");
        return y + "-" + m + "-" + day;
    }

    function getCurrentUser() {
        return JSON.parse(sessionStorage.getItem("CurrentUser") || "null");
    }

    function requireAdmin() {
        var currentUser = getCurrentUser();
        if (!currentUser) {
            window.location.href = "/UserAccount/Login?t=" + new Date().getTime();
            return false;
        }
        if (!currentUser.IsAdmin) {
            window.location.href = "/UserAccount/UserProfile?t=" + new Date().getTime();
            return false;
        }
        return true;
    }

    function convertTo12Hour(timeStr) {
        if (!timeStr) return "";
        if (timeStr.indexOf("AM") >= 0 || timeStr.indexOf("PM") >= 0) return timeStr;
        var parts = timeStr.split(":");
        var hours = parseInt(parts[0]);
        var minutes = parts[1] || "00";
        var ampm = hours >= 12 ? "PM" : "AM";
        var hr12 = hours % 12 || 12;
        return hr12 + ":" + minutes + " " + ampm;
    }
    function getBirthYearVal(dateStr) {
        if (!dateStr) return null;
        var d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d.getUTCFullYear();
        var y = parseInt((dateStr + "").substring(0, 4));
        return isNaN(y) ? null : y;
    }

    $scope.getBirthYear = function (dateStr) {
        return getBirthYearVal(dateStr) || null;
    };

    $scope.getDisplayDate = function (val) {
        return getDateOnly(val);
    };

    $scope.blockNameNumberInput = function (event) {
        var key = event.which || event.keyCode;
        if (key >= 48 && key <= 57) {
            event.preventDefault();
        }
    };

    $scope.sanitizeNameInput = function (field) {
        if (!$scope[field]) return;
        $scope[field] = $scope[field].replace(/[0-9]/g, "");
    };

    $scope.validateFName = function () {
        $scope.sanitizeNameInput("FName");
        if (!$scope.FName || $scope.FName.trim() === "") {
            $scope.errors.FName = "First name is required.";
        } else if (!/^[A-Za-z\s\-]+$/.test($scope.FName)) {
            $scope.errors.FName = "First name must contain letters only.";
        } else {
            $scope.errors.FName = "";
        }
    };

    $scope.validateLName = function () {
        $scope.sanitizeNameInput("LName");
        if (!$scope.LName || $scope.LName.trim() === "") {
            $scope.errors.LName = "Last name is required.";
        } else if (!/^[A-Za-z\s\-]+$/.test($scope.LName)) {
            $scope.errors.LName = "Last name must contain letters only.";
        } else {
            $scope.errors.LName = "";
        }
    };

    $scope.validateBirthDate = function () {
        if (!$scope.BirthDate) {
            $scope.errors.BirthDate = "Birth date is required.";
            return;
        }
        var birth = new Date($scope.BirthDate);
        var now = new Date();
        var age = now.getFullYear() - birth.getFullYear();
        var monthDiff = now.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
            age--;
        }
        if (birth > now) {
            $scope.errors.BirthDate = "Birth date cannot be in the future.";
        } else if (age < 1) {
            $scope.errors.BirthDate = "Please enter a valid birth date.";
        } else {
            $scope.errors.BirthDate = "";
        }
    };

    $scope.validateGender = function () {
        if (!$scope.Gender || $scope.Gender === "") {
            $scope.errors.Gender = "Please select a gender.";
        } else {
            $scope.errors.Gender = "";
        }
    };

    $scope.allowNumbersOnly = function (event) {
        var charCode = event.which || event.keyCode;
        if (charCode < 48 || charCode > 57) {
            event.preventDefault();
        }
    };

    $scope.validatePhone = function () {
        if ($scope.Phone) {
            $scope.Phone = $scope.Phone.replace(/\D/g, "");
        }
        var phoneRegex = /^(09|\+639)\d{9}$/;
        if (!$scope.Phone || $scope.Phone.trim() === "") {
            $scope.errors.Phone = "Phone number is required.";
        } else if (!phoneRegex.test($scope.Phone)) {
            $scope.errors.Phone = "Enter a valid PH number (e.g. 09171234567).";
        } else {
            $scope.errors.Phone = "";
        }
    };

    $scope.validateAddress = function () {
        if (!$scope.Address || $scope.Address.trim() === "") {
            $scope.errors.Address = "Home address is required.";
        } else if ($scope.Address.trim().length < 10) {
            $scope.errors.Address = "Please enter a more complete address (min 10 chars).";
        } else {
            $scope.errors.Address = "";
        }
    };

    $scope.validateUsername = function () {
        if (!$scope.Username || $scope.Username.trim() === "") {
            $scope.errors.Username = "Username is required.";
        } else if ($scope.Username.length < 4) {
            $scope.errors.Username = "Username must be at least 4 characters.";
        } else if (!/^[A-Za-z0-9_]+$/.test($scope.Username)) {
            $scope.errors.Username = "Username can only contain letters, numbers, and underscores.";
        } else {
            var duplicate = $scope.newArray.find(function (u) {
                return u.Username === $scope.Username;
            });
            if (duplicate) {
                $scope.errors.Username = "Username is already taken.";
            } else {
                $scope.errors.Username = "";
            }
        }
    };

    $scope.validatePassword = function () {
        var pw = $scope.Password || "";
        $scope.pwChecks = {
            length: pw.length >= 8,
            upper: /[A-Z]/.test(pw),
            lower: /[a-z]/.test(pw),
            number: /[0-9]/.test(pw),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)
        };
        if (!pw) {
            $scope.errors.Password = "Password is required.";
        } else if (!$scope.pwChecks.length || !$scope.pwChecks.upper || !$scope.pwChecks.lower || !$scope.pwChecks.number || !$scope.pwChecks.special) {
            $scope.errors.Password = "Password does not meet all requirements.";
        } else {
            $scope.errors.Password = "";
        }
        if ($scope.ConfirmPassword) {
            $scope.validateConfirmPassword();
        }
    };

    $scope.validateConfirmPassword = function () {
        if (!$scope.ConfirmPassword || $scope.ConfirmPassword === "") {
            $scope.errors.ConfirmPassword = "Please confirm your password.";
        } else if ($scope.ConfirmPassword !== $scope.Password) {
            $scope.errors.ConfirmPassword = "Passwords do not match.";
        } else {
            $scope.errors.ConfirmPassword = "";
        }
    };

    $scope.validateAll = function () {
        $scope.validateFName();
        $scope.validateLName();
        $scope.validateBirthDate();
        $scope.validateGender();
        $scope.validatePhone();
        $scope.validateAddress();
        $scope.validateUsername();
        $scope.validatePassword();
        $scope.validateConfirmPassword();
        return !$scope.errors.FName &&
            !$scope.errors.LName &&
            !$scope.errors.BirthDate &&
            !$scope.errors.Gender &&
            !$scope.errors.Phone &&
            !$scope.errors.Address &&
            !$scope.errors.Username &&
            !$scope.errors.Password &&
            !$scope.errors.ConfirmPassword;
    };

    function resetUserForm() {
        $scope.patientSearch = "";
        $scope.patientGenderFilter = "";
        $scope.patientYearFrom = null;
        $scope.patientYearTo = null;
        $scope.patientSortField = "FName";
        $scope.patientSortReverse = false;
        $scope.patientPage = 1;
        $scope.patientPageSize = 5;
        $scope.showLogin = false;
        $scope.editIndex = -1;
        $scope.errors = {};
        $scope.pwChecks = { length: false, upper: false, lower: false, number: false, special: false };
        $scope.FName = ""; $scope.MName = ""; $scope.LName = "";
        $scope.BirthDate = ""; $scope.Gender = ""; $scope.Phone = "";
        $scope.Address = ""; $scope.Username = ""; $scope.Password = ""; $scope.ConfirmPassword = "";
    }

    $scope.loadRegistration = function () {
        resetUserForm();
    };

    $scope.loadUsers = function () {
        if (!requireAdmin()) return;
        resetUserForm();

        $http.get("/UserAccount/GetPatients").then(function (response) {
            if (response.data.success) {
                $scope.newArray = response.data.patients;
            } else {
                $scope.newArray = [];
            }
        }, function () {
            $scope.newArray = [];
        });
    };

    $scope.cancelFunc = function () {
        $scope.FName = "";
        $scope.MName = "";
        $scope.LName = "";
        $scope.BirthDate = "";
        $scope.Gender = "";
        $scope.Phone = "";
        $scope.Address = "";
        $scope.Username = "";
        $scope.Password = "";
        $scope.ConfirmPassword = "";
        $scope.editIndex = -1;
        $scope.errors = {};
        $scope.pwChecks = { length: false, upper: false, lower: false, number: false, special: false };
    };

    $scope.addFunc = function () {
        if (!$scope.validateAll()) {
            Swal.fire({
                icon: "warning", title: "Incomplete Form",
                text: "Please fix the errors before submitting.", confirmButtonColor: "#0cb8b6"
            });
            return;
        }

        var userData = {
            FName: $scope.FName, MName: $scope.MName || "", LName: $scope.LName,
            BirthDate: $scope.BirthDate, Gender: $scope.Gender,
            Phone: $scope.Phone, Address: $scope.Address,
            Username: $scope.Username, Password: $scope.Password
        };

        $http.post("/UserAccount/Register", userData).then(function (response) {
            if (response.data.success) {
                $scope.showLogin = true;
                $scope.cancelFunc();
                Swal.fire({
                    icon: "success", title: "Registered!",
                    text: "User has been successfully registered.", confirmButtonColor: "#0cb8b6"
                });
            } else {
                Swal.fire({
                    icon: "error", title: "Registration Failed",
                    text: response.data.message, confirmButtonColor: "#0cb8b6"
                });
            }
        }, function () {
            Swal.fire({
                icon: "error", title: "Server Error",
                text: "Could not connect to the server.", confirmButtonColor: "#0cb8b6"
            });
        });
    };

    $scope.updFunc = function (arrayIndex) {
        if ($scope.editIndex === arrayIndex) {
            $http.post("/UserAccount/UpdatePatient", {
                PatientId: $scope.newArray[arrayIndex].PatientId,
                FName: $scope.FName,
                MName: $scope.MName || "",
                LName: $scope.LName,
                Username: $scope.Username,
                Password: $scope.Password
            }).then(function (response) {
                if (response.data.success) {
                    $scope.newArray[arrayIndex].FName = $scope.FName;
                    $scope.newArray[arrayIndex].MName = $scope.MName || "";
                    $scope.newArray[arrayIndex].LName = $scope.LName;
                    $scope.newArray[arrayIndex].Username = $scope.Username;
                    $scope.editIndex = -1;
                    $scope.cancelFunc();
                    Swal.fire({
                        icon: "success", title: "Updated!",
                        text: "User has been successfully updated.", confirmButtonColor: "#0cb8b6"
                    });
                } else {
                    Swal.fire({
                        icon: "error", title: "Update Failed",
                        text: response.data.message, confirmButtonColor: "#e53935"
                    });
                }
            });
        } else {
            var user = $scope.newArray[arrayIndex];
            $scope.FName = user.FName;
            $scope.MName = user.MName || "";
            $scope.LName = user.LName;
            $scope.Username = user.Username;
            $scope.Password = "";
            $scope.editIndex = arrayIndex;
        }
    };

    $scope.delFunc = function (indexArray) {
        Swal.fire({
            icon: "warning", title: "Are you sure?",
            text: "This user will be permanently deleted.",
            showCancelButton: true, confirmButtonColor: "#e53935",
            cancelButtonColor: "#6c757d", confirmButtonText: "Yes, delete it!"
        }).then(function (result) {
            if (result.isConfirmed) {
                var patientId = $scope.newArray[indexArray].PatientId;
                $http.post("/UserAccount/DeletePatient", { PatientId: patientId }).then(function (response) {
                    if (response.data.success) {
                        $scope.newArray.splice(indexArray, 1);
                        $scope.$apply ? null : $scope.$apply();
                        Swal.fire({
                            icon: "success", title: "Deleted!",
                            text: "User has been deleted.", confirmButtonColor: "#0cb8b6"
                        });
                    } else {
                        Swal.fire({
                            icon: "error", title: "Delete Failed",
                            text: response.data.message, confirmButtonColor: "#e53935"
                        });
                    }
                });
            }
        });
    };

    $scope.getFilteredUsers = function () {
        var list = $scope.newArray.slice();

        if ($scope.patientSearch && $scope.patientSearch.trim() !== "") {
            var q = $scope.patientSearch.trim().toLowerCase();
            list = list.filter(function (u) {
                return (u.FName && u.FName.toLowerCase().indexOf(q) >= 0) ||
                    (u.LName && u.LName.toLowerCase().indexOf(q) >= 0) ||
                    (u.Username && u.Username.toLowerCase().indexOf(q) >= 0);
            });
        }

        if ($scope.patientGenderFilter && $scope.patientGenderFilter !== "") {
            var gf = $scope.patientGenderFilter.toLowerCase();
            list = list.filter(function (u) {
                return u.Gender && u.Gender.toLowerCase() === gf;
            });
        }

        if ($scope.patientYearFrom) {
            list = list.filter(function (u) {
                return getBirthYearVal(u.BirthDate) >= parseInt($scope.patientYearFrom);
            });
        }

        if ($scope.patientYearTo) {
            list = list.filter(function (u) {
                return getBirthYearVal(u.BirthDate) <= parseInt($scope.patientYearTo);
            });
        }

        // Sort
        if ($scope.patientSortField) {
            list = list.sort(function (a, b) {
                var valA = (a[$scope.patientSortField] || "").toString().toLowerCase();
                var valB = (b[$scope.patientSortField] || "").toString().toLowerCase();
                if (valA < valB) return $scope.patientSortReverse ? 1 : -1;
                if (valA > valB) return $scope.patientSortReverse ? -1 : 1;
                return 0;
            });
        }
        return list;
    };

    $scope.sortPatients = function (field) {
        $scope.patientSortReverse = ($scope.patientSortField === field) ? !$scope.patientSortReverse : false;
        $scope.patientSortField = field;
        $scope.patientPage = 1;
    };

    $scope.hasActivePatientFilters = function () {
        return ($scope.patientSearch && $scope.patientSearch !== "") ||
            ($scope.patientGenderFilter && $scope.patientGenderFilter !== "") ||
            $scope.patientYearFrom || $scope.patientYearTo;
    };

    $scope.getPatientTotalPages = function () {
        return Math.ceil($scope.getFilteredUsers().length / $scope.patientPageSize) || 1;
    };
    $scope.getPatientPages = function () {
        var pages = [];
        for (var i = 1; i <= $scope.getPatientTotalPages(); i++) pages.push(i);
        return pages;
    };
    $scope.getPagedUsers = function () {
        var start = ($scope.patientPage - 1) * $scope.patientPageSize;
        return $scope.getFilteredUsers().slice(start, start + $scope.patientPageSize);
    };
    $scope.getPatientRangeStart = function () {
        return ($scope.patientPage - 1) * $scope.patientPageSize + 1;
    };
    $scope.getPatientRangeEnd = function () {
        return Math.min($scope.patientPage * $scope.patientPageSize, $scope.getFilteredUsers().length);
    };
    $scope.getRowNumber = function (i) {
        return ($scope.patientPage - 1) * $scope.patientPageSize + i + 1;
    };
    $scope.resetPatientPage = function () { $scope.patientPage = 1; };
    $scope.goToPatientPage = function (p) { $scope.patientPage = p; };
    $scope.prevPatientPage = function () { if ($scope.patientPage > 1) $scope.patientPage--; };
    $scope.nextPatientPage = function () { if ($scope.patientPage < $scope.getPatientTotalPages()) $scope.patientPage++; };
    $scope.resetPatientFilters = function () {
        $scope.patientSearch = "";
        $scope.patientGenderFilter = "";
        $scope.patientYearFrom = null;
        $scope.patientYearTo = null;
        $scope.patientPage = 1;
    };

    // REDIRECT

    $scope.redirectFunc = function (page) {
        var routes = {
            "login": "/UserAccount/Login",
            "registration": "/UserAccount/Registration",
            "dashboard": "/UserAccount/Dashboard",
            "welcome": "/UserAccount/Welcome",
            "profile": "/UserAccount/UserProfile",
            "bookappointment": "/UserAccount/BookAppointment",
            "appointments": "/UserAccount/AppointmentManagement"
        };
        if (routes[page]) {
            sessionStorage.setItem("UserArray", JSON.stringify($scope.newArray));
            window.location.href = routes[page] + "?t=" + new Date().getTime();
        }
    };

    // LOGIN

    $scope.loginFunc = function () {
        if (!$scope.Username || !$scope.Password) {
            Swal.fire({
                icon: "warning", title: "Missing Fields",
                text: "Please enter your username and password.", confirmButtonColor: "#0cb8b6"
            });
            return;
        }

        $http.post("/UserAccount/Login", {
            Username: $scope.Username,
            Password: $scope.Password
        }).then(function (response) {
            if (response.data.success) {
                sessionStorage.setItem("CurrentUser", JSON.stringify(response.data.user));
                Swal.fire({
                    icon: "success", title: "Welcome!",
                    text: "You have successfully logged in.",
                    confirmButtonColor: "#0cb8b6", timer: 1500, showConfirmButton: false
                }).then(function () {
                    var redirectUrl = response.data.user.IsAdmin ? "/UserAccount/Welcome" : "/UserAccount/UserProfile";
                    window.location.href = redirectUrl + "?t=" + new Date().getTime();
                });
            } else {
                Swal.fire({
                    icon: "error", title: "Login Failed",
                    text: response.data.message, confirmButtonColor: "#e53935"
                });
            }
        }, function () {
            Swal.fire({
                icon: "error", title: "Server Error",
                text: "Could not connect to the server.", confirmButtonColor: "#e53935"
            });
        });
    };

    // WELCOME

    $scope.welcomeFunc = function () {
        var storedUser = sessionStorage.getItem("CurrentUser");
        $scope.currentUser = storedUser ? JSON.parse(storedUser) : null;
        if (!$scope.currentUser) {
            window.location.href = "/UserAccount/Login?t=" + new Date().getTime();
            return;
        }
        if (!$scope.currentUser.IsAdmin) {
            window.location.href = "/UserAccount/UserProfile?t=" + new Date().getTime();
        }
    };

    $scope.logoutFunc = function () {
        sessionStorage.removeItem("CurrentUser");
        window.location.href = "/UserAccount/Login?t=" + new Date().getTime();
    };

    $scope.loadUserProfile = function () {
        var storedUser = sessionStorage.getItem("CurrentUser");
        $scope.currentUser = storedUser ? JSON.parse(storedUser) : null;

        if (!$scope.currentUser) {
            window.location.href = "/UserAccount/Login?t=" + new Date().getTime();
            return;
        }

        if ($scope.currentUser.IsAdmin) {
            window.location.href = "/UserAccount/Welcome?t=" + new Date().getTime();
            return;
        }

        $scope.profileErrors = {};
        $scope.profilePassword = "";
        $scope.profile = {
            PatientId: $scope.currentUser.PatientId,
            FName: $scope.currentUser.FName || "",
            MName: $scope.currentUser.MName || "",
            LName: $scope.currentUser.LName || "",
            BirthDate: $scope.currentUser.BirthDate ? new Date($scope.currentUser.BirthDate) : null,
            Gender: $scope.currentUser.Gender || "",
            Phone: $scope.currentUser.Phone || "",
            Address: $scope.currentUser.Address || "",
            Username: $scope.currentUser.Username || ""
        };

        $scope.patientAppointments = [];
        $scope.currentAppointments = [];
        $scope.appointmentHistory = [];

        $http.get("/UserAccount/GetPatientAppointments", {
            params: { PatientId: $scope.currentUser.PatientId }
        }).then(function (response) {
            if (response.data.success) {
                $scope.patientAppointments = response.data.appointments || [];
                $scope.currentAppointments = $scope.patientAppointments.filter(function (a) { return a.IsCurrent; });
                $scope.appointmentHistory = $scope.patientAppointments.filter(function (a) { return !a.IsCurrent; });
            }
        });
    };

    $scope.updateProfileFunc = function () {
        if (!$scope.profile.FName || !$scope.profile.LName || !$scope.profile.BirthDate ||
            !$scope.profile.Gender || !$scope.profile.Phone || !$scope.profile.Address || !$scope.profile.Username) {
            Swal.fire({
                icon: "warning", title: "Missing Fields",
                text: "Please complete all required profile fields.",
                confirmButtonColor: "#0cb8b6"
            });
            return;
        }

        var birthDate = "";
        if ($scope.profile.BirthDate) {
            var d = new Date($scope.profile.BirthDate);
            birthDate = d.getFullYear() + "-" +
                String(d.getMonth() + 1).padStart(2, "0") + "-" +
                String(d.getDate()).padStart(2, "0");
        }

        $http.post("/UserAccount/UpdateProfile", {
            PatientId: $scope.profile.PatientId,
            FName: $scope.profile.FName,
            MName: $scope.profile.MName,
            LName: $scope.profile.LName,
            BirthDate: birthDate,
            Gender: $scope.profile.Gender,
            Phone: $scope.profile.Phone,
            Address: $scope.profile.Address,
            Username: $scope.profile.Username,
            Password: $scope.profilePassword
        }).then(function (response) {
            if (response.data.success) {
                sessionStorage.setItem("CurrentUser", JSON.stringify(response.data.user));
                $scope.currentUser = response.data.user;
                $scope.profilePassword = "";
                Swal.fire({
                    icon: "success", title: "Profile Updated",
                    text: "Your information has been saved.",
                    confirmButtonColor: "#0cb8b6"
                });
            } else {
                Swal.fire({
                    icon: "error", title: "Update Failed",
                    text: response.data.message,
                    confirmButtonColor: "#e53935"
                });
            }
        }, function () {
            Swal.fire({
                icon: "error", title: "Server Error",
                text: "Could not update your profile.",
                confirmButtonColor: "#e53935"
            });
        });
    };

    // DASHBOARD

    var dashboardCharts = {};

    function renderDashboardChart(canvasId, config) {
        if (typeof Chart === "undefined") return;

        var canvas = document.getElementById(canvasId);
        if (!canvas) return;

        if (dashboardCharts[canvasId]) {
            dashboardCharts[canvasId].destroy();
        }

        dashboardCharts[canvasId] = new Chart(canvas, config);
    }

    $scope.loadDashboard = function () {
        if (!requireAdmin()) return;
        $scope.dashboardStats = {
            totalPatients: 0,
            totalAppointments: 0,
            todaysAppointments: 0,
            availableTherapists: 0,
            pendingReview: 0,
            approvedPayments: 0
        };
        $scope.therapyChartTable = [];
        $scope.statusChartTable = [];
        $scope.revenueChartTable = [];
        $scope.dashboardChartTable = [];

        UserAccountService.getDashboardStatsService().then(function (response) {
            if (response.data.success) {
                $scope.dashboardStats = response.data.stats;
                $scope.availableTherapists = response.data.stats.availableTherapists;
            }
        });

        $scope.loadAdminCharts();
    };

    $scope.loadTherapyAppointmentChart = function () {
        UserAccountService.getTherapyAppointmentChartService().then(function (response) {
            if (!response.data.success) return;
            var labels = response.data.labels || [];
            var data = response.data.data || [];

            $scope.therapyChartTable = labels.map(function (label, index) {
                return {
                    therapy: label,
                    appointments: data[index] || 0
                };
            });
            updateDashboardChartTable();

            renderDashboardChart("therapyChart", {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Appointments",
                        data: data,
                        backgroundColor: ["#0cb8b6", "#1a2942", "#28a745", "#f59e0b", "#7c3aed"],
                        borderRadius: 8,
                        barThickness: 40
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1, color: "#aaa" }, grid: { color: "#f0f4f8" } },
                        x: { ticks: { color: "#888" }, grid: { display: false } }
                    }
                }
            });
        });
    };

    $scope.loadAppointmentStatusChart = function () {
        UserAccountService.getAppointmentStatusChartService().then(function (response) {
            if (!response.data.success) return;
            var labels = response.data.labels || [];
            var data = response.data.data || [];

            $scope.statusChartTable = labels.map(function (label, index) {
                return {
                    status: label,
                    appointments: data[index] || 0
                };
            });
            updateDashboardChartTable();

            renderDashboardChart("statusChart", {
                type: "doughnut",
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: ["#f59e0b", "#0cb8b6", "#e53935"],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { position: "bottom", labels: { color: "#888", font: { size: 12 } } } },
                    cutout: "68%"
                }
            });
        });
    };

    $scope.loadWeeklyRevenueChart = function () {
        UserAccountService.getWeeklyRevenueChartService().then(function (response) {
            if (!response.data.success) return;
            var labels = response.data.labels || [];
            var data = response.data.data || [];

            $scope.revenueChartTable = labels.map(function (label, index) {
                return {
                    week: label,
                    revenue: data[index] || 0
                };
            });
            updateDashboardChartTable();

            renderDashboardChart("salesWeekChart", {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Revenue",
                        data: data,
                        borderColor: "#28a745",
                        backgroundColor: "rgba(40,167,69,0.08)",
                        pointBackgroundColor: "#28a745",
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        borderWidth: 2.5,
                        tension: 0.35,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function (ctx) {
                                    return " PHP " + Number(ctx.parsed.y || 0).toLocaleString();
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: "#aaa",
                                callback: function (value) { return "PHP " + Number(value).toLocaleString(); }
                            },
                            grid: { color: "#f0f4f8" }
                        },
                        x: { ticks: { color: "#888" }, grid: { display: false } }
                    }
                }
            });
        });
    };

    $scope.loadAdminCharts = function () {
        $scope.loadTherapyAppointmentChart();
        $scope.loadAppointmentStatusChart();
        $scope.loadWeeklyRevenueChart();
    };

    function updateDashboardChartTable() {
        var rows = [];

        angular.forEach($scope.therapyChartTable || [], function (item) {
            rows.push({
                ChartName: "Therapy Appointments",
                Label: item.therapy,
                Value: item.appointments,
                ValueType: "Appointments"
            });
        });

        angular.forEach($scope.statusChartTable || [], function (item) {
            rows.push({
                ChartName: "Appointment Status",
                Label: item.status,
                Value: item.appointments,
                ValueType: "Appointments"
            });
        });

        angular.forEach($scope.revenueChartTable || [], function (item) {
            rows.push({
                ChartName: "Weekly Revenue",
                Label: item.week,
                Value: item.revenue,
                ValueType: "Revenue"
            });
        });

        $scope.dashboardChartTable = rows;
    }

    $scope.getDashboardChartValue = function (row) {
        if (!row) return "";
        if (row.ValueType === "Revenue") {
            return "PHP " + Number(row.Value || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        return row.Value;
    };

    $scope.getPaymentCount = function (status) {
        var appts = $scope.apptArray || [];
        if (status === "Unpaid") {
            return appts.filter(function (a) {
                return !a.PaymentStatus || a.PaymentStatus === "Unpaid";
            }).length;
        }
        return appts.filter(function (a) { return a.PaymentStatus === status; }).length;
    };

    var therapyFees = {
        "Physical Therapy": 800,
        "Occupational Therapy": 800,
        "Respiratory Therapy": 1000,
        "Speech-Language Therapy": 900
    };

    $scope.updateTherapyFee = function () {
        $scope.ApptTherapyFee = therapyFees[$scope.ApptTherapy] || 0;
        $scope.ApptReceipt = "";
        $scope.ApptReceiptPreview = "";
        $scope.apptErrors.ApptReceipt = "";
        var input = document.getElementById("receiptFileInput");
        if (input) input.value = "";
    };

    $scope.triggerReceiptUpload = function () {
        document.getElementById("receiptFileInput").click();
    };

    $scope.onReceiptSelected = function (input) {
        var file = input.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            $scope.apptErrors.ApptReceipt = "File is too large. Max size is 5MB.";
            $scope.$apply();
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            $scope.ApptReceipt = e.target.result;      
            $scope.ApptReceiptPreview = e.target.result;
            $scope.apptErrors.ApptReceipt = "";
            $scope.$apply();
        };
        reader.readAsDataURL(file);
    };

    $scope.validateApptReceipt = function () {
        if ($scope.ApptTherapyFee && (!$scope.ApptReceipt || $scope.ApptReceipt === "")) {
            $scope.apptErrors.ApptReceipt = "Please upload your payment receipt.";
        } else {
            $scope.apptErrors.ApptReceipt = "";
        }
    };


    $scope.loadAppointments = function () {
        var storedAppts = sessionStorage.getItem("AppointmentArray");
        $scope.apptArray = storedAppts ? JSON.parse(storedAppts) : [];
        $scope.showApptSuccess = false;
        $scope.apptErrors = {};

        var currentUser = JSON.parse(sessionStorage.getItem("CurrentUser") || "null");
        if (!currentUser) {
            Swal.fire({
                icon: "warning", title: "Login Required",
                text: "You must be logged in to book an appointment.",
                confirmButtonText: "Go to Login", confirmButtonColor: "#0cb8b6",
                allowOutsideClick: false, allowEscapeKey: false
            }).then(function () {
                window.location.href = "/UserAccount/Login?t=" + new Date().getTime();
            });
            return;
        }

        $scope.isLoggedIn = true;
        $scope.ApptFName = currentUser.FName || "";
        $scope.ApptLName = currentUser.LName || "";
        $scope.ApptDOB = currentUser.BirthDate ? new Date(currentUser.BirthDate) : null;
        $scope.ApptSex = currentUser.Gender || "";
        $scope.ApptContact = currentUser.Phone || "";
        $scope.ApptAddress = currentUser.Address || "";

        $scope.ApptTherapy = "";
        $scope.ApptDate = "";
        $scope.ApptTime = "";
        $scope.ApptComplaint = "";
        $scope.ApptTherapyFee = 0;
        $scope.ApptReceipt = "";
        $scope.ApptReceiptPreview = "";

        var today = new Date();
        $scope.maxDate = today.toISOString().split("T")[0];
        var tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        $scope.minApptDate = tomorrow.toISOString().split("T")[0];
    };

    $scope.cancelApptFunc = function () {
        $scope.ApptFName = "";
        $scope.ApptLName = "";
        $scope.ApptDOB = "";
        $scope.ApptSex = "";
        $scope.ApptContact = "";
        $scope.ApptAddress = "";
        $scope.ApptTherapy = "";
        $scope.ApptDate = "";
        $scope.ApptTime = "";
        $scope.ApptComplaint = "";
        $scope.ApptTherapyFee = 0;
        $scope.ApptReceipt = "";
        $scope.ApptReceiptPreview = "";
        $scope.apptErrors = {};
        var input = document.getElementById("receiptFileInput");
        if (input) input.value = "";
    };


    $scope.validateApptFName = function () {
        if (!$scope.ApptFName || $scope.ApptFName.trim() === "") {
            $scope.apptErrors.ApptFName = "First name is required.";
        } else if (!/^[A-Za-z\s\-]+$/.test($scope.ApptFName)) {
            $scope.apptErrors.ApptFName = "First name must contain letters only.";
        } else {
            $scope.apptErrors.ApptFName = "";
        }
    };

    $scope.validateApptLName = function () {
        if (!$scope.ApptLName || $scope.ApptLName.trim() === "") {
            $scope.apptErrors.ApptLName = "Last name is required.";
        } else if (!/^[A-Za-z\s\-]+$/.test($scope.ApptLName)) {
            $scope.apptErrors.ApptLName = "Last name must contain letters only.";
        } else {
            $scope.apptErrors.ApptLName = "";
        }
    };

    $scope.validateApptDOB = function () {
        if (!$scope.ApptDOB) {
            $scope.apptErrors.ApptDOB = "Date of birth is required.";
            return;
        }
        var birth = new Date($scope.ApptDOB);
        var now = new Date();
        var age = now.getFullYear() - birth.getFullYear();
        var monthDiff = now.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
        if (birth > now) {
            $scope.apptErrors.ApptDOB = "Date of birth cannot be in the future.";
        } else if (age < 1) {
            $scope.apptErrors.ApptDOB = "Please enter a valid date of birth.";
        } else {
            $scope.apptErrors.ApptDOB = "";
        }
    };

    $scope.validateApptSex = function () {
        $scope.apptErrors.ApptSex = (!$scope.ApptSex || $scope.ApptSex === "")
            ? "Please select a sex." : "";
    };

    $scope.validateApptContact = function () {
        if ($scope.ApptContact) $scope.ApptContact = $scope.ApptContact.replace(/\D/g, "");
        var phoneRegex = /^(09|\+639)\d{9}$/;
        if (!$scope.ApptContact || $scope.ApptContact.trim() === "") {
            $scope.apptErrors.ApptContact = "Contact number is required.";
        } else if (!phoneRegex.test($scope.ApptContact)) {
            $scope.apptErrors.ApptContact = "Enter a valid PH number (e.g. 09171234567).";
        } else {
            $scope.apptErrors.ApptContact = "";
        }
    };

    $scope.validateApptAddress = function () {
        if (!$scope.ApptAddress || $scope.ApptAddress.trim() === "") {
            $scope.apptErrors.ApptAddress = "Home address is required.";
        } else if ($scope.ApptAddress.trim().length < 10) {
            $scope.apptErrors.ApptAddress = "Please enter a more complete address (min 10 chars).";
        } else {
            $scope.apptErrors.ApptAddress = "";
        }
    };

    $scope.validateApptTherapy = function () {
        $scope.apptErrors.ApptTherapy = (!$scope.ApptTherapy || $scope.ApptTherapy === "")
            ? "Please select a therapy type." : "";
    };

    $scope.validateApptDate = function () {
        $scope.apptErrors.ApptDate = (!$scope.ApptDate)
            ? "Preferred date is required." : "";
    };

    $scope.validateApptTime = function () {
        $scope.apptErrors.ApptTime = (!$scope.ApptTime || $scope.ApptTime === "")
            ? "Please select a preferred time." : "";
    };

    $scope.validateApptComplaint = function () {
        if (!$scope.ApptComplaint || $scope.ApptComplaint.trim() === "") {
            $scope.apptErrors.ApptComplaint = "Chief complaint is required.";
        } else if ($scope.ApptComplaint.trim().length < 5) {
            $scope.apptErrors.ApptComplaint = "Please describe your condition (min 5 chars).";
        } else {
            $scope.apptErrors.ApptComplaint = "";
        }
    };

    $scope.validateAllAppt = function () {
        $scope.validateApptFName();
        $scope.validateApptLName();
        $scope.validateApptDOB();
        $scope.validateApptSex();
        $scope.validateApptContact();
        $scope.validateApptAddress();
        $scope.validateApptTherapy();
        $scope.validateApptDate();
        $scope.validateApptTime();
        $scope.validateApptReceipt();
        return !$scope.apptErrors.ApptFName && !$scope.apptErrors.ApptLName &&
            !$scope.apptErrors.ApptDOB && !$scope.apptErrors.ApptSex &&
            !$scope.apptErrors.ApptContact && !$scope.apptErrors.ApptAddress &&
            !$scope.apptErrors.ApptTherapy && !$scope.apptErrors.ApptDate &&
            !$scope.apptErrors.ApptTime &&
            !$scope.apptErrors.ApptReceipt;
    };

    $scope.addApptFunc = function () {
        if ($scope.isSubmittingAppt) return;
        if (!$scope.validateAllAppt()) {
            Swal.fire({
                icon: "warning", title: "Incomplete Form",
                text: "Please fix the errors before submitting.", confirmButtonColor: "#0cb8b6"
            });
            return;
        }

        var currentUser = JSON.parse(sessionStorage.getItem("CurrentUser") || "null");

        var formData = new FormData();
        formData.append("PatientId", currentUser.PatientId);
        formData.append("ApptTherapy", $scope.ApptTherapy);
        var apptDateStr = "";
        if ($scope.ApptDate) {
            var d = new Date($scope.ApptDate);
            var y = d.getFullYear();
            var m = String(d.getMonth() + 1).padStart(2, "0");
            var day = String(d.getDate()).padStart(2, "0");
            apptDateStr = y + "-" + m + "-" + day;
        }
        formData.append("ApptDate", apptDateStr);
        formData.append("ApptTime", $scope.ApptTime);

        var fileInput = document.getElementById("receiptFileInput");
        if (fileInput && fileInput.files.length > 0) {
            formData.append("ReceiptFile", fileInput.files[0]);
        }

        $scope.isSubmittingAppt = true;
        $http.post("/UserAccount/BookAppointment", formData, {
            transformRequest: angular.identity,
            headers: { "Content-Type": undefined }
        }).then(function (response) {
            if (response.data.success) {
                $scope.showApptSuccess = true;
                $scope.cancelApptFunc();
                Swal.fire({
                    icon: "success", title: "Appointment Submitted!",
                    text: "Your appointment request has been received.", confirmButtonColor: "#0cb8b6"
                });
            } else {
                Swal.fire({
                    icon: "error", title: "Submission Failed",
                    text: response.data.message, confirmButtonColor: "#e53935"
                });
            }
        }, function () {
            Swal.fire({
                icon: "error", title: "Server Error",
                text: "Could not connect to the server.", confirmButtonColor: "#e53935"
            });
        }).finally(function () {
            $scope.isSubmittingAppt = false;
        });
    };

    // APPOINTMENT MANAGEMENT

    $scope.loadApptManagement = function () {
        if (!requireAdmin()) return;
        $scope.apptArray = [];
        $http.get("/UserAccount/GetAppointments").then(function (response) {
            if (response.data.success) {
                $scope.apptArray = response.data.appointments;
            }
        }, function () {
            $scope.apptArray = [];
        });

        $scope.therapistArray = [];
        $http.get("/UserAccount/GetTherapists").then(function (response) {
            if (response.data.success) {
                $scope.therapistArray = response.data.therapists;
            }
        });
        $scope.apptMgmtSearch = "";
        $scope.apptMgmtFilterStatus = "";
        $scope.apptMgmtFilterTherapy = "";
        $scope.apptMgmtFromDate = "";
        $scope.apptMgmtToDate = "";
        $scope.apptSortField = "ApptDate";
        $scope.apptSortReverse = false;
        $scope.apptPage = 1;
        $scope.apptPageSize = 5;

        $scope.apptEditIndex = -1;
        $scope.apptMgmtErrors = {};
        $scope.ApptMgmtPatient = "";
        $scope.ApptMgmtTherapy = "";
        $scope.ApptMgmtTherapist = "";
        $scope.ApptMgmtStatus = "";
        $scope.ApptMgmtDate = "";
        $scope.ApptMgmtTime = "";
    };

    $scope.validateApptTherapist = function () {
        $scope.apptMgmtErrors.ApptMgmtTherapist =
            (!$scope.ApptMgmtTherapist || $scope.ApptMgmtTherapist === "" || $scope.ApptMgmtTherapist === null)
                ? "Please assign a therapist." : "";
    };

    $scope.validateApptStatus = function () {
        $scope.apptMgmtErrors.ApptMgmtStatus =
            (!$scope.ApptMgmtStatus || $scope.ApptMgmtStatus === "")
                ? "Please select a status." : "";
    };

    $scope.validateApptMgmtDate = function () {
        $scope.apptMgmtErrors.ApptMgmtDate =
            (!$scope.ApptMgmtDate || $scope.ApptMgmtDate === "")
                ? "Please select a date." : "";
    };

    $scope.validateApptMgmtTime = function () {
        $scope.apptMgmtErrors.ApptMgmtTime =
            (!$scope.ApptMgmtTime || $scope.ApptMgmtTime === "")
                ? "Please select a time." : "";
    };

    $scope.validateAllApptMgmt = function () {
        $scope.validateApptStatus();
        $scope.validateApptMgmtDate();
        $scope.validateApptMgmtTime();

        if ($scope.ApptMgmtStatus !== "Declined") {
            $scope.apptMgmtErrors.ApptMgmtTherapist =
                (!$scope.ApptMgmtTherapist || $scope.ApptMgmtTherapist === "" || $scope.ApptMgmtTherapist === null)
                    ? "Please assign a therapist." : "";
        } else {
            $scope.apptMgmtErrors.ApptMgmtTherapist = "";
        }

        return !$scope.apptMgmtErrors.ApptMgmtStatus &&
            !$scope.apptMgmtErrors.ApptMgmtDate &&
            !$scope.apptMgmtErrors.ApptMgmtTime &&
            !$scope.apptMgmtErrors.ApptMgmtTherapist;
    };


    $scope.editApptMgmt = function (index) {
        $scope.apptEditIndex = index;
        var appt = $scope.apptArray[index];

        $scope.ApptMgmtPatient = appt.ApptFName + " " + appt.ApptLName;
        $scope.ApptMgmtTherapy = appt.ApptTherapy;
        $scope.ApptMgmtStatus = appt.ApptStatus || "";
        $scope.ApptMgmtPaymentStatus = appt.PaymentStatus || "Unpaid";
        $scope.apptMgmtErrors = {};

        $timeout(function () {
            var parts = appt.ApptDate.substring(0, 10).split("-");
            $scope.ApptMgmtDate = new Date(parts[0], parts[1] - 1, parts[2]);
            $scope.ApptMgmtTime = convertTo12Hour(appt.ApptTime);
            $scope.ApptMgmtTherapist = appt.ApptTherapistId || "";
        }, 100);
    };

    $scope.cancelApptMgmt = function () {
        $scope.apptEditIndex = -1;
        $scope.ApptMgmtPatient = "";
        $scope.ApptMgmtTherapy = "";
        $scope.ApptMgmtTherapist = null;
        $scope.ApptMgmtStatus = "";
        $scope.ApptMgmtDate = "";
        $scope.ApptMgmtTime = "";
        $scope.ApptMgmtPaymentStatus = "";
        $scope.apptMgmtErrors = {};
    };

    $scope.saveApptMgmt = function () {
        console.log("ApptMgmtTherapist at save:", $scope.ApptMgmtTherapist);
        if ($scope.apptEditIndex === -1) {
            Swal.fire({
                icon: "warning", title: "No Appointment Selected",
                text: "Please click Edit on an appointment first.", confirmButtonColor: "#0cb8b6"
            });
            return;
        }
        if (!$scope.validateAllApptMgmt()) {
            Swal.fire({
                icon: "warning", title: "Incomplete Form",
                text: "Please fix the errors before saving.", confirmButtonColor: "#0cb8b6"
            });
            return;
        }
        var idx = $scope.apptEditIndex;
        $scope.apptArray[idx].ApptTherapist = $scope.ApptMgmtTherapist;
        $scope.apptArray[idx].ApptStatus = $scope.ApptMgmtStatus;
        $scope.apptArray[idx].ApptDate = $scope.ApptMgmtDate;
        $scope.apptArray[idx].ApptTime = $scope.ApptMgmtTime;
        $scope.apptArray[idx].PaymentStatus = $scope.ApptMgmtPaymentStatus || $scope.apptArray[idx].PaymentStatus;
        var appt = $scope.apptArray[idx];
        $http.post("/UserAccount/UpdateAppointment", {
            AppointmentId: appt.AppointmentId,
            ApptTherapist: $scope.ApptMgmtTherapist,
            ApptStatus: $scope.ApptMgmtStatus,
            ApptDate: $scope.ApptMgmtDate,
            ApptTime: $scope.ApptMgmtTime
        }).then(function (response) {
            if (response.data.success) {
                $scope.cancelApptMgmt();
                $scope.loadApptManagement();
                Swal.fire({ icon: "success", title: "Saved!", text: "Appointment has been updated.", confirmButtonColor: "#0cb8b6" });
            } else {
                Swal.fire({ icon: "error", title: "Save Failed", text: response.data.message, confirmButtonColor: "#e53935" });
            }
        });
        $scope.cancelApptMgmt();
        Swal.fire({
            icon: "success", title: "Saved!",
            text: "Appointment has been updated.", confirmButtonColor: "#0cb8b6"
        });
    };

    $scope.delApptFunc = function (index) {
        Swal.fire({
            icon: "warning", title: "Are you sure?",
            text: "This appointment will be permanently deleted.",
            showCancelButton: true, confirmButtonColor: "#e53935",
            cancelButtonColor: "#6c757d", confirmButtonText: "Yes, delete it!"
        }).then(function (result) {
            if (result.isConfirmed) {
                var appointmentId = $scope.apptArray[index].AppointmentId;
                $http.post("/UserAccount/DeleteAppointment", { AppointmentId: appointmentId })
                    .then(function (response) {
                        if (response.data.success) {
                            $scope.apptArray.splice(index, 1);
                            Swal.fire({ icon: "success", title: "Deleted!", text: "Appointment has been deleted.", confirmButtonColor: "#0cb8b6" });
                        } else {
                            Swal.fire({ icon: "error", title: "Failed", text: response.data.message, confirmButtonColor: "#e53935" });
                        }
                    });
            }
        });
    };

    // APPOINTMENT MANAGEMENT TABLE

    $scope.getFilteredAppts = function () {
        var list = $scope.apptArray.slice();

        if ($scope.apptMgmtSearch && $scope.apptMgmtSearch.trim() !== "") {
            var q = $scope.apptMgmtSearch.trim().toLowerCase();
            list = list.filter(function (a) {
                return (a.ApptFName && a.ApptFName.toLowerCase().indexOf(q) >= 0) ||
                    (a.ApptLName && a.ApptLName.toLowerCase().indexOf(q) >= 0);
            });
        }

        if ($scope.apptMgmtFilterStatus && $scope.apptMgmtFilterStatus !== "") {
            list = list.filter(function (a) {
                return a.ApptStatus === $scope.apptMgmtFilterStatus;
            });
        }

        if ($scope.apptMgmtFilterTherapy && $scope.apptMgmtFilterTherapy !== "") {
            list = list.filter(function (a) {
                return a.ApptTherapy === $scope.apptMgmtFilterTherapy;
            });
        }

        if ($scope.apptMgmtFromDate && $scope.apptMgmtFromDate !== "") {
            list = list.filter(function (a) {
                var fromStr = getDateOnly($scope.apptMgmtFromDate); return getDateOnly(a.ApptDate) >= fromStr;
            });
        }

        if ($scope.apptMgmtToDate && $scope.apptMgmtToDate !== "") {
            list = list.filter(function (a) {
                var toStr = getDateOnly($scope.apptMgmtToDate); return getDateOnly(a.ApptDate) <= toStr;
            });
        }

        if ($scope.apptSortField) {
            list = list.sort(function (a, b) {
                var valA, valB;
                if ($scope.apptSortField === "ApptDate") {
                    valA = getDateOnly(a.ApptDate);
                    valB = getDateOnly(b.ApptDate);
                } else {
                    valA = (a[$scope.apptSortField] || "").toString().toLowerCase();
                    valB = (b[$scope.apptSortField] || "").toString().toLowerCase();
                }
                if (valA < valB) return $scope.apptSortReverse ? 1 : -1;
                if (valA > valB) return $scope.apptSortReverse ? -1 : 1;
                return 0;
            });
        }
        return list;
    };

    $scope.sortAppts = function (field) {
        $scope.apptSortReverse = ($scope.apptSortField === field) ? !$scope.apptSortReverse : false;
        $scope.apptSortField = field;
        $scope.apptPage = 1;
    };

    $scope.hasActiveApptFilters = function () {
        return ($scope.apptMgmtSearch && $scope.apptMgmtSearch !== "") ||
            ($scope.apptMgmtFilterStatus && $scope.apptMgmtFilterStatus !== "") ||
            ($scope.apptMgmtFilterTherapy && $scope.apptMgmtFilterTherapy !== "") ||
            ($scope.apptMgmtFromDate && $scope.apptMgmtFromDate !== "") ||
            ($scope.apptMgmtToDate && $scope.apptMgmtToDate !== "");
    };

    $scope.getApptTotalPages = function () {
        return Math.ceil($scope.getFilteredAppts().length / $scope.apptPageSize) || 1;
    };
    $scope.getApptPages = function () {
        var pages = [];
        for (var i = 1; i <= $scope.getApptTotalPages(); i++) pages.push(i);
        return pages;
    };
    $scope.getPagedAppts = function () {
        var start = ($scope.apptPage - 1) * $scope.apptPageSize;
        return $scope.getFilteredAppts().slice(start, start + $scope.apptPageSize);
    };
    $scope.getApptRangeStart = function () {
        return ($scope.apptPage - 1) * $scope.apptPageSize + 1;
    };
    $scope.getApptRangeEnd = function () {
        return Math.min($scope.apptPage * $scope.apptPageSize, $scope.getFilteredAppts().length);
    };
    $scope.getApptRowNumber = function (i) {
        return ($scope.apptPage - 1) * $scope.apptPageSize + i + 1;
    };
    $scope.resetApptPage = function () { $scope.apptPage = 1; };
    $scope.goToApptPage = function (p) { $scope.apptPage = p; };
    $scope.prevApptPage = function () { if ($scope.apptPage > 1) $scope.apptPage--; };
    $scope.nextApptPage = function () { if ($scope.apptPage < $scope.getApptTotalPages()) $scope.apptPage++; };
    $scope.isCurrentApptPage = function (p) { return p === $scope.apptPage; };
    $scope.resetApptMgmtFilters = function () {
        $scope.apptMgmtSearch = "";
        $scope.apptMgmtFilterStatus = "";
        $scope.apptMgmtFilterTherapy = "";
        $scope.apptMgmtFromDate = "";
        $scope.apptMgmtToDate = "";
        $scope.apptPage = 1;
    };

    $scope.allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    $scope.loadTherapists = function () {
        if (!requireAdmin()) return;
        $scope.therapistArray = [];
        $http.get("/UserAccount/GetTherapists").then(function (response) {
            if (response.data.success) {
                $scope.therapistArray = response.data.therapists;
            }
        }, function () {
            $scope.therapistArray = [];
        });

        $scope.therapistSearch = "";
        $scope.therapistSpecialtyFilter = "";
        $scope.therapistStatusFilter = "";
        $scope.therapistDayFilter = "";
        $scope.therapistSortField = "TherapistName";
        $scope.therapistSortReverse = false;
        $scope.therapistPage = 1;
        $scope.therapistPageSize = 5;
        $scope.therapistEditIndex = -1;
        $scope.therapistErrors = {};
        $scope.TherapistName = "";
        $scope.TherapistSpecialty = "";
        $scope.therapistDays = [];
        $scope.TherapistTimeFrom = "";
        $scope.TherapistTimeTo = "";
        $scope.TherapistStatus = "";
    };

    $scope.toggleDay = function (day) {
        var idx = $scope.therapistDays.indexOf(day);
        if (idx >= 0) {
            $scope.therapistDays.splice(idx, 1);
        } else {
            $scope.therapistDays.push(day);
        }
        $scope.validateTherapistDays();
    };

    $scope.validateTherapistName = function () {
        if (!$scope.TherapistName || $scope.TherapistName.trim() === "") {
            $scope.therapistErrors.TherapistName = "Therapist name is required.";
        } else if ($scope.TherapistName.trim().length < 3) {
            $scope.therapistErrors.TherapistName = "Name must be at least 3 characters.";
        } else {
            $scope.therapistErrors.TherapistName = "";
        }
    };

    $scope.validateTherapistSpecialty = function () {
        $scope.therapistErrors.TherapistSpecialty =
            (!$scope.TherapistSpecialty || $scope.TherapistSpecialty === "")
                ? "Please select a specialty." : "";
    };

    $scope.validateTherapistDays = function () {
        $scope.therapistErrors.TherapistDays =
            (!$scope.therapistDays || $scope.therapistDays.length === 0)
                ? "Please select at least one day." : "";
    };

    $scope.validateTherapistTime = function () {
        if (!$scope.TherapistTimeFrom || !$scope.TherapistTimeTo) {
            $scope.therapistErrors.TherapistTime = "Please select both start and end time.";
        } else if ($scope.TherapistTimeFrom === $scope.TherapistTimeTo) {
            $scope.therapistErrors.TherapistTime = "Start and end time cannot be the same.";
        } else {
            $scope.therapistErrors.TherapistTime = "";
        }
    };

    $scope.validateTherapistStatus = function () {
        $scope.therapistErrors.TherapistStatus =
            (!$scope.TherapistStatus || $scope.TherapistStatus === "")
                ? "Please select an availability status." : "";
    };

    $scope.validateAllTherapist = function () {
        $scope.validateTherapistName();
        $scope.validateTherapistSpecialty();
        $scope.validateTherapistDays();
        $scope.validateTherapistTime();
        $scope.validateTherapistStatus();
        return !$scope.therapistErrors.TherapistName &&
            !$scope.therapistErrors.TherapistSpecialty &&
            !$scope.therapistErrors.TherapistDays &&
            !$scope.therapistErrors.TherapistTime &&
            !$scope.therapistErrors.TherapistStatus;
    };

    $scope.cancelTherapistFunc = function () {
        $scope.therapistEditIndex = -1;
        $scope.therapistErrors = {};
        $scope.TherapistName = "";
        $scope.TherapistSpecialty = "";
        $scope.therapistDays = [];
        $scope.TherapistTimeFrom = "";
        $scope.TherapistTimeTo = "";
        $scope.TherapistStatus = "";
    };

    $scope.saveTherapistFunc = function () {
        if (!$scope.validateAllTherapist()) {
            Swal.fire({
                icon: "warning", title: "Incomplete Form",
                text: "Please fix the errors before saving.",
                confirmButtonColor: "#0cb8b6"
            });
            return;
        }

        var therapistId = ($scope.therapistEditIndex === -1)
            ? "0"
            : ($scope.therapistArray[$scope.therapistEditIndex].TherapistId || "0");

        $http.post("/UserAccount/SaveTherapist", {
            TherapistId: therapistId,
            TherapistName: $scope.TherapistName.trim(),
            TherapistSpecialty: $scope.TherapistSpecialty,
            TherapistDays: $scope.therapistDays.join(","),
            TherapistTimeFrom: $scope.TherapistTimeFrom,
            TherapistTimeTo: $scope.TherapistTimeTo,
            TherapistStatus: $scope.TherapistStatus
        }).then(function (response) {
            if (response.data.success) {
                $scope.cancelTherapistFunc();
                $scope.loadTherapists();
                Swal.fire({
                    icon: "success",
                    title: therapistId === "0" ? "Added!" : "Updated!",
                    text: "Therapist has been saved successfully.",
                    confirmButtonColor: "#0cb8b6"
                });
            } else {
                Swal.fire({
                    icon: "error", title: "Save Failed",
                    text: response.data.message, confirmButtonColor: "#e53935"
                });
            }
        });
    };

    $scope.editTherapistFunc = function (index) {
        $scope.therapistEditIndex = index;
        var t = $scope.therapistArray[index];
        $scope.TherapistName = t.TherapistName;
        $scope.TherapistSpecialty = t.TherapistSpecialty;
        $scope.therapistDays = t.TherapistDays ? t.TherapistDays.slice() : [];
        $scope.TherapistTimeFrom = t.TherapistTimeFrom;
        $scope.TherapistTimeTo = t.TherapistTimeTo;
        $scope.TherapistStatus = t.TherapistStatus;
        $scope.therapistErrors = {};
    };

    $scope.delTherapistFunc = function (index) {
        Swal.fire({
            icon: "warning", title: "Are you sure?",
            text: "This therapist will be permanently deleted.",
            showCancelButton: true, confirmButtonColor: "#e53935",
            cancelButtonColor: "#6c757d", confirmButtonText: "Yes, delete it!"
        }).then(function (result) {
            if (result.isConfirmed) {
                var therapistId = $scope.therapistArray[index].TherapistId;
                $http.post("/UserAccount/DeleteTherapist", { TherapistId: therapistId })
                    .then(function (response) {
                        if (response.data.success) {
                            $scope.therapistArray.splice(index, 1);
                            if ($scope.therapistEditIndex === index) {
                                $scope.cancelTherapistFunc();
                            }
                            Swal.fire({
                                icon: "success", title: "Deleted!",
                                text: "Therapist has been deleted.",
                                confirmButtonColor: "#0cb8b6"
                            });
                        } else {
                            Swal.fire({
                                icon: "error", title: "Failed",
                                text: response.data.message, confirmButtonColor: "#e53935"
                            });
                        }
                    });
            }
        });
    };

    $scope.getFilteredTherapists = function () {
        var list = $scope.therapistArray.slice();

        if ($scope.therapistSearch && $scope.therapistSearch.trim() !== "") {
            var q = $scope.therapistSearch.trim().toLowerCase();
            list = list.filter(function (t) {
                return t.TherapistName && t.TherapistName.toLowerCase().indexOf(q) >= 0;
            });
        }

        if ($scope.therapistSpecialtyFilter && $scope.therapistSpecialtyFilter !== "") {
            list = list.filter(function (t) {
                return t.TherapistSpecialty === $scope.therapistSpecialtyFilter;
            });
        }

        if ($scope.therapistStatusFilter && $scope.therapistStatusFilter !== "") {
            list = list.filter(function (t) {
                return t.TherapistStatus === $scope.therapistStatusFilter;
            });
        }

        if ($scope.therapistDayFilter && $scope.therapistDayFilter !== "") {
            list = list.filter(function (t) {
                return t.TherapistDays && t.TherapistDays.indexOf($scope.therapistDayFilter) >= 0;
            });
        }

        if ($scope.therapistSortField) {
            list = list.sort(function (a, b) {
                var valA = (a[$scope.therapistSortField] || "").toString().toLowerCase();
                var valB = (b[$scope.therapistSortField] || "").toString().toLowerCase();
                if (valA < valB) return $scope.therapistSortReverse ? 1 : -1;
                if (valA > valB) return $scope.therapistSortReverse ? -1 : 1;
                return 0;
            });
        }

        return list;
    };

    $scope.sortTherapists = function (field) {
        $scope.therapistSortReverse = ($scope.therapistSortField === field)
            ? !$scope.therapistSortReverse : false;
        $scope.therapistSortField = field;
        $scope.therapistPage = 1;
    };

    $scope.hasActiveTherapistFilters = function () {
        return ($scope.therapistSearch && $scope.therapistSearch !== "") ||
            ($scope.therapistSpecialtyFilter && $scope.therapistSpecialtyFilter !== "") ||
            ($scope.therapistStatusFilter && $scope.therapistStatusFilter !== "") ||
            ($scope.therapistDayFilter && $scope.therapistDayFilter !== "");
    };

    $scope.getTherapistTotalPages = function () {
        return Math.ceil($scope.getFilteredTherapists().length / $scope.therapistPageSize) || 1;
    };
    $scope.getTherapistPages = function () {
        var pages = [];
        for (var i = 1; i <= $scope.getTherapistTotalPages(); i++) pages.push(i);
        return pages;
    };
    $scope.getPagedTherapists = function () {
        var start = ($scope.therapistPage - 1) * $scope.therapistPageSize;
        return $scope.getFilteredTherapists().slice(start, start + $scope.therapistPageSize);
    };
    $scope.getTherapistRangeStart = function () {
        return ($scope.therapistPage - 1) * $scope.therapistPageSize + 1;
    };
    $scope.getTherapistRangeEnd = function () {
        return Math.min($scope.therapistPage * $scope.therapistPageSize, $scope.getFilteredTherapists().length);
    };
    $scope.getTherapistRowNumber = function (i) {
        return ($scope.therapistPage - 1) * $scope.therapistPageSize + i + 1;
    };
    $scope.resetTherapistPage = function () { $scope.therapistPage = 1; };
    $scope.goToTherapistPage = function (p) { $scope.therapistPage = p; };
    $scope.prevTherapistPage = function () { if ($scope.therapistPage > 1) $scope.therapistPage--; };
    $scope.nextTherapistPage = function () { if ($scope.therapistPage < $scope.getTherapistTotalPages()) $scope.therapistPage++; };
    $scope.resetTherapistFilters = function () {
        $scope.therapistSearch = "";
        $scope.therapistSpecialtyFilter = "";
        $scope.therapistStatusFilter = "";
        $scope.therapistDayFilter = "";
        $scope.therapistPage = 1;
    };

    function getDayAbbrev(dateStr) {
        if (!dateStr) return "";
        var d = new Date(dateStr + "T00:00:00");
        var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return days[d.getDay()];
    }
    $scope.getEligibleTherapists = function () {
        if (!$scope.therapistArray || $scope.therapistArray.length === 0) return [];
        var therapy = $scope.ApptMgmtTherapy || "";
        console.log("Filtering therapy:", therapy);
        return $scope.therapistArray.filter(function (t) {
            var isAvailable = t.TherapistStatus === "Available";
            var matchSpecialty = !therapy || t.TherapistSpecialty === therapy;
            console.log(t.TherapistName, "| specialty:", t.TherapistSpecialty, "| available:", isAvailable, "| match:", matchSpecialty);
            return isAvailable && matchSpecialty;
        });
    };

    $scope.onStatusChange = function () {
        $scope.validateApptStatus();
        if ($scope.ApptMgmtStatus === "Declined") {
            $scope.ApptMgmtTherapist = "";
            $scope.apptMgmtErrors.ApptMgmtTherapist = "";
        }
    };

    $scope.getTodayAppts = function () {
        var today = getDateOnly(new Date());
        return ($scope.apptArray || []).filter(function (a) {
            return getDateOnly(a.ApptDate) === today;
        }).length;
    };

    // PAYMENT MANAGEMENT

    $scope.loadPayments = function () {
        if (!requireAdmin()) return;
        $scope.apptArray = [];
        $http.get("/UserAccount/GetPayments").then(function (response) {
            if (response.data.success) {
                $scope.apptArray = response.data.payments;

                $scope.apptArray.forEach(function (appt) {
                    if (appt.ApptReceipt) {
                        appt.ApptReceipt = $sce.trustAsResourceUrl(appt.ApptReceipt);
                    }
                });

                $scope.openReceipt = function (trustedUrl) {
                    window.open(trustedUrl.$$unwrapTrustedValue(), '_blank');
                };

                $scope.refreshPayStats();
            }
        }, function () {
            $scope.apptArray = [];
        });

        $scope.paySearch = "";
        $scope.payStatusFilter = "";
        $scope.payTherapyFilter = "";
        $scope.payFromDate = "";
        $scope.payToDate = "";
        $scope.paySortField = "ApptDate";
        $scope.paySortReverse = false;
        $scope.payPage = 1;
        $scope.payPageSize = 5;
        $scope.payDetailOpen = false;
        $scope.payDetailIndex = -1;
        $scope.payDetailAppt = null;
        $scope.payStats = { review: 0, approved: 0, rejected: 0, totalCollected: 0 };
    };

    $scope.getReceiptUrl = function (receipt) {
        if (!receipt) return '';
        if (receipt.$$unwrapTrustedValue) return receipt.$$unwrapTrustedValue();
        return receipt;
    };

    $scope.refreshPayStats = function () {
        var appts = $scope.apptArray || [];
        $scope.payStats = {
            review: appts.filter(function (a) { return a.PaymentStatus === "Pending Review"; }).length,
            approved: appts.filter(function (a) { return a.PaymentStatus === "Approved"; }).length,
            rejected: appts.filter(function (a) { return a.PaymentStatus === "Rejected"; }).length,
            totalCollected: appts.filter(function (a) { return a.PaymentStatus === "Approved"; })
                .reduce(function (sum, a) { return sum + (parseFloat(a.ApptTherapyFee) || 0); }, 0)
        };
    };

    $scope.getFilteredPayments = function () {
        var list = ($scope.apptArray || []).map(function (a, i) {
            a._realIndex = i;
            return a;
        });

        if ($scope.paySearch && $scope.paySearch.trim() !== "") {
            var q = $scope.paySearch.trim().toLowerCase();
            list = list.filter(function (a) {
                return (a.ApptFName && a.ApptFName.toLowerCase().indexOf(q) >= 0) ||
                    (a.ApptLName && a.ApptLName.toLowerCase().indexOf(q) >= 0);
            });
        }

        if ($scope.payStatusFilter && $scope.payStatusFilter !== "") {
            if ($scope.payStatusFilter === "Unpaid") {
                list = list.filter(function (a) { return !a.PaymentStatus || a.PaymentStatus === "Unpaid"; });
            } else {
                list = list.filter(function (a) { return a.PaymentStatus === $scope.payStatusFilter; });
            }
        }

        if ($scope.payTherapyFilter && $scope.payTherapyFilter !== "") {
            list = list.filter(function (a) { return a.ApptTherapy === $scope.payTherapyFilter; });
        }

        if ($scope.payFromDate && $scope.payFromDate !== "") {
            var fromStr = getDateOnly($scope.payFromDate);
            list = list.filter(function (a) { return getDateOnly(a.ApptDate) >= fromStr; });
        }

        if ($scope.payToDate && $scope.payToDate !== "") {
            var toStr = getDateOnly($scope.payToDate);
            list = list.filter(function (a) { return getDateOnly(a.ApptDate) <= toStr; });
        }

        if ($scope.paySortField) {
            list = list.sort(function (a, b) {
                var valA = $scope.paySortField === "ApptDate" ? getDateOnly(a.ApptDate)
                    : $scope.paySortField === "ApptTherapyFee" ? (parseFloat(a.ApptTherapyFee) || 0)
                        : (a[$scope.paySortField] || "").toString().toLowerCase();
                var valB = $scope.paySortField === "ApptDate" ? getDateOnly(b.ApptDate)
                    : $scope.paySortField === "ApptTherapyFee" ? (parseFloat(b.ApptTherapyFee) || 0)
                        : (b[$scope.paySortField] || "").toString().toLowerCase();
                if (valA < valB) return $scope.paySortReverse ? 1 : -1;
                if (valA > valB) return $scope.paySortReverse ? -1 : 1;
                return 0;
            });
        }
        return list;
    };

    $scope.sortPayments = function (field) {
        $scope.paySortReverse = ($scope.paySortField === field) ? !$scope.paySortReverse : false;
        $scope.paySortField = field;
        $scope.payPage = 1;
    };

    $scope.hasActivePayFilters = function () {
        return ($scope.paySearch && $scope.paySearch !== "") ||
            ($scope.payStatusFilter && $scope.payStatusFilter !== "") ||
            ($scope.payTherapyFilter && $scope.payTherapyFilter !== "") ||
            ($scope.payFromDate && $scope.payFromDate !== "") ||
            ($scope.payToDate && $scope.payToDate !== "");
    };

    $scope.getPayTotalPages = function () {
        return Math.ceil($scope.getFilteredPayments().length / $scope.payPageSize) || 1;
    };
    $scope.getPayPages = function () {
        var pages = [];
        for (var i = 1; i <= $scope.getPayTotalPages(); i++) pages.push(i);
        return pages;
    };
    $scope.getPagedPayments = function () {
        var filtered = $scope.getFilteredPayments();
        var start = ($scope.payPage - 1) * $scope.payPageSize;
        return filtered.slice(start, start + $scope.payPageSize).map(function (item) {
            item._realIndex = $scope.apptArray.indexOf(item);
            return item;
        });
    };
    $scope.getPayRangeStart = function () { return ($scope.payPage - 1) * $scope.payPageSize + 1; };
    $scope.getPayRangeEnd = function () {
        return Math.min($scope.payPage * $scope.payPageSize, $scope.getFilteredPayments().length);
    };
    $scope.getPayRowNumber = function (i) { return ($scope.payPage - 1) * $scope.payPageSize + i + 1; };
    $scope.resetPayPage = function () { $scope.payPage = 1; };
    $scope.goToPayPage = function (p) { $scope.payPage = p; };
    $scope.prevPayPage = function () { if ($scope.payPage > 1) $scope.payPage--; };
    $scope.nextPayPage = function () { if ($scope.payPage < $scope.getPayTotalPages()) $scope.payPage++; };
    $scope.resetPayFilters = function () {
        $scope.paySearch = ""; $scope.payStatusFilter = ""; $scope.payTherapyFilter = "";
        $scope.payFromDate = ""; $scope.payToDate = ""; $scope.payPage = 1;
    };

    $scope.viewPaymentDetail = function (index) {
        $scope.payDetailIndex = index;
        $scope.payDetailAppt = $scope.apptArray[index];
        $scope.payDetailOpen = true;

        var receipt = $scope.apptArray[index].ApptReceipt;
        if (receipt && receipt.$$unwrapTrustedValue) {
            $scope.receiptImageUrl = receipt.$$unwrapTrustedValue();
        } else {
            $scope.receiptImageUrl = receipt || '';
        }
    };

    $scope.closePayDetail = function () {
        $scope.payDetailOpen = false;
        $scope.payDetailAppt = null;
        $scope.payDetailIndex = -1;
    };

    $scope.setPayStatus = function (status) {
        if ($scope.payDetailIndex < 0) return;
        var paymentId = $scope.apptArray[$scope.payDetailIndex].PaymentId;
        $http.post("/UserAccount/UpdatePaymentStatus", { PaymentId: paymentId, PaymentStatus: status })
            .then(function (response) {
                if (response.data.success) {
                    $scope.apptArray[$scope.payDetailIndex].PaymentStatus = status;
                    $scope.payDetailAppt = $scope.apptArray[$scope.payDetailIndex];
                    $scope.refreshPayStats();
                    Swal.fire({
                        icon: status === "Approved" ? "success" : status === "Rejected" ? "error" : "info",
                        title: status,
                        text: "Payment status updated to \"" + status + "\".",
                        confirmButtonColor: "#0cb8b6", timer: 1800, showConfirmButton: false
                    });
                }
            });
    };

    $scope.quickApprove = function (realIndex) {
        var paymentId = $scope.apptArray[realIndex].PaymentId;
        $http.post("/UserAccount/UpdatePaymentStatus", { PaymentId: paymentId, PaymentStatus: "Approved" })
            .then(function (response) {
                if (response.data.success) {
                    $scope.apptArray[realIndex].PaymentStatus = "Approved";
                    $scope.refreshPayStats();
                }
            });
    };

    $scope.quickReject = function (realIndex) {
        var paymentId = $scope.apptArray[realIndex].PaymentId;
        $http.post("/UserAccount/UpdatePaymentStatus", { PaymentId: paymentId, PaymentStatus: "Rejected" })
            .then(function (response) {
                if (response.data.success) {
                    $scope.apptArray[realIndex].PaymentStatus = "Rejected";
                    $scope.refreshPayStats();
                }
            });
    };

});


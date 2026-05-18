using System;
using MachineProblem4.Models;
using MachineProblem4.Models.Tables;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using System.Security.Cryptography;
using System.Text;
using System.IO;

namespace MachineProblem4.Controllers
{
    public class UserAccountController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Registration()
        {
            return View();
        }

        public ActionResult Login()
        {
            return View();
        }

        public ActionResult Welcome()
        {
            return View();
        }

        public ActionResult UserProfile()
        {
            return View();
        }

        public ActionResult Dashboard()
        {
            return View();
        }

        public ActionResult Patients()
        {
            return View();
        }

        public ActionResult Payment()
        {
            return View();
        }

        public ActionResult BookAppointment()
        {
            return View();
        }

        public ActionResult AppointmentManagement()
        {
            return View();
        }

        public ActionResult Therapists()
        {
            return View();
        }

        [HttpPost]
        public JsonResult Register(string FName, string MName, string LName,
            string BirthDate, string Gender, string Phone, string Address,
            string Username, string Password)
        {
            try
            {
                string passwordHash = HashPassword(Password);

                using (var db = new RehabCareDBContext())
                {
                    bool usernameExists = (from p in db.tbl_patients
                                           where p.username == Username
                                           select p).Any();

                    if (usernameExists)
                        return Json(new { success = false, message = "Username already taken." });

                    DateTime parsedBirthDate;
                    DateTime? birthDate = DateTime.TryParse(BirthDate, out parsedBirthDate)
                        ? parsedBirthDate
                        : (DateTime?)null;

                    db.tbl_patients.Add(new tbl_patient
                    {
                        first_name = FName,
                        middle_name = MName,
                        last_name = LName,
                        date_of_birth = birthDate,
                        gender = Gender,
                        contact_number = Phone,
                        address = Address,
                        username = Username,
                        password_hash = passwordHash,
                        is_deleted = false,
                        is_active = true,
                        created_at = DateTime.Now
                    });

                    db.SaveChanges();
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = GetFullErrorMessage(ex) });
            }
        }

        [HttpPost]
        public JsonResult Login(string Username, string Password)
        {
            try
            {
                if (Username == "admin" && Password == "admin123")
                {
                    var admin = new
                    {
                        PatientId = 0,
                        FName = "Admin",
                        MName = "",
                        LName = "User",
                        Username = "admin",
                        Phone = "",
                        Gender = "",
                        Address = "",
                        BirthDate = "",
                        IsAdmin = true
                    };

                    return Json(new { success = true, user = admin });
                }

                string passwordHash = HashPassword(Password);

                using (var db = new RehabCareDBContext())
                {
                    var patient = (from p in db.tbl_patients
                                   where p.username == Username
                                      && p.password_hash == passwordHash
                                      && p.is_deleted == false
                                      && p.is_active == true
                                   select p).FirstOrDefault();

                    if (patient == null)
                        return Json(new { success = false, message = "Username or password is incorrect." });

                    var user = new
                    {
                        PatientId = patient.patient_id,
                        FName = patient.first_name,
                        MName = patient.middle_name,
                        LName = patient.last_name,
                        Username = patient.username,
                        Phone = patient.contact_number,
                        Gender = patient.gender,
                        Address = patient.address,
                        BirthDate = patient.date_of_birth.HasValue ? patient.date_of_birth.Value.ToString("yyyy-MM-dd") : "",
                        IsAdmin = false
                    };

                    return Json(new { success = true, user = user });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = GetFullErrorMessage(ex) });
            }
        }

        [HttpPost]
        public JsonResult UpdateProfile(int PatientId, string FName, string MName,
                                        string LName, string BirthDate, string Gender,
                                        string Phone, string Address, string Username,
                                        string Password)
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    bool usernameTaken = (from p in db.tbl_patients
                                          where p.username == Username
                                             && p.patient_id != PatientId
                                          select p).Any();

                    if (usernameTaken)
                        return Json(new { success = false, message = "Username already taken." });

                    var patient = (from p in db.tbl_patients
                                   where p.patient_id == PatientId
                                      && p.is_deleted == false
                                   select p).FirstOrDefault();

                    if (patient == null)
                        return Json(new { success = false, message = "Patient not found." });

                    DateTime parsedBirthDate;
                    if (!DateTime.TryParse(BirthDate, out parsedBirthDate))
                        return Json(new { success = false, message = "Invalid birth date." });

                    patient.first_name = FName;
                    patient.middle_name = MName;
                    patient.last_name = LName;
                    patient.date_of_birth = parsedBirthDate.Date;
                    patient.gender = Gender;
                    patient.contact_number = Phone;
                    patient.address = Address;
                    patient.username = Username;
                    patient.updated_at = DateTime.Now;

                    if (!string.IsNullOrEmpty(Password))
                        patient.password_hash = HashPassword(Password);

                    db.SaveChanges();

                    var user = new
                    {
                        PatientId = patient.patient_id,
                        FName = patient.first_name,
                        MName = patient.middle_name,
                        LName = patient.last_name,
                        Username = patient.username,
                        Phone = patient.contact_number,
                        Gender = patient.gender,
                        Address = patient.address,
                        BirthDate = patient.date_of_birth.HasValue ? patient.date_of_birth.Value.ToString("yyyy-MM-dd") : "",
                        IsAdmin = false
                    };

                    return Json(new { success = true, user = user });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = GetFullErrorMessage(ex) });
            }
        }

        [HttpGet]
        public JsonResult GetPatientAppointments(int PatientId)
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    var appointmentRows = (from a in db.tbl_appointments
                                           join s in db.tbl_services on a.service_id equals s.service_id
                                           join t in db.tbl_therapists on a.therapist_id equals t.therapist_id into tJoin
                                           from t in tJoin.DefaultIfEmpty()
                                           join pay in db.tbl_payments on a.appointment_id equals pay.appointment_id into payJoin
                                           from pay in payJoin.DefaultIfEmpty()
                                           where a.patient_id == PatientId
                                              && a.is_deleted == false
                                           orderby a.appointment_date descending
                                           select new
                                           {
                                               a.appointment_id,
                                               a.appointment_date,
                                               a.appointment_time,
                                               a.appt_status,
                                               s.service_name,
                                               therapist_name = t != null ? t.full_name : null,
                                               payment_status = pay != null ? pay.payment_status : null
                                           }).ToList();

                    DateTime today = DateTime.Today;

                    var appointments = appointmentRows.Select(a => new
                    {
                        AppointmentId = a.appointment_id.ToString(),
                        ApptTherapy = a.service_name,
                        ApptDate = a.appointment_date.ToString("yyyy-MM-dd"),
                        ApptTime = FormatTime(a.appointment_time),
                        ApptStatus = a.appt_status,
                        ApptTherapist = a.therapist_name ?? "Unassigned",
                        PaymentStatus = a.payment_status ?? "Unpaid",
                        IsCurrent = a.appointment_date.Date >= today && a.appt_status != "Declined"
                    }).ToList();

                    return Json(new { success = true, appointments = appointments }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = GetFullErrorMessage(ex) }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetDashboardStats()
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    DateTime today = DateTime.Today;

                    int totalPatients = (from p in db.tbl_patients
                                         where p.is_deleted == false
                                         select p).Count();

                    int totalAppointments = (from a in db.tbl_appointments
                                             where a.is_deleted == false
                                             select a).Count();

                    int todaysAppointments = (from a in db.tbl_appointments
                                              where a.is_deleted == false
                                                 && a.appointment_date == today
                                              select a).Count();

                    int availableTherapists = (from t in db.tbl_therapists
                                               where t.status == "Available"
                                                  && t.is_deleted == false
                                               select t).Count();

                    int pendingReview = (from p in db.tbl_payments
                                         where p.payment_status == "Pending Review"
                                         select p).Count();

                    int approvedPayments = (from p in db.tbl_payments
                                            where p.payment_status == "Approved"
                                            select p).Count();

                    var stats = new DashboardStatsModel
                    {
                        totalPatients = totalPatients,
                        totalAppointments = totalAppointments,
                        todaysAppointments = todaysAppointments,
                        availableTherapists = availableTherapists,
                        pendingReview = pendingReview,
                        approvedPayments = approvedPayments
                    };

                    return Json(new { success = true, stats = stats }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = GetFullErrorMessage(ex) }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetTherapyAppointmentChart()
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    var therapyRows = (from s in db.tbl_services
                                       join a in db.tbl_appointments on s.service_id equals a.service_id into apptJoin
                                       where s.is_active == true
                                       select new
                                       {
                                           s.service_name,
                                           Count = apptJoin.Count(a => a.is_deleted == false)
                                       }).ToList();

                    var chartData = new ChartTherapyAppointmentModel
                    {
                        labels = therapyRows.Select(t => t.service_name).ToList(),
                        data = therapyRows.Select(t => t.Count).ToList()
                    };

                    return Json(new
                    {
                        success = true,
                        labels = chartData.labels,
                        data = chartData.data
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = GetFullErrorMessage(ex) }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetAppointmentStatusChart()
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    var statuses = new List<string> { "Pending", "Accepted", "Declined" };

                    var statusCounts = statuses.Select(status => new
                    {
                        Status = status,
                        Count = (from a in db.tbl_appointments
                                 where a.is_deleted == false
                                    && a.appt_status == status
                                 select a).Count()
                    }).ToList();

                    var chartData = new ChartAppointmentStatusModel
                    {
                        labels = statusCounts.Select(s => s.Status).ToList(),
                        data = statusCounts.Select(s => s.Count).ToList()
                    };

                    return Json(new
                    {
                        success = true,
                        labels = chartData.labels,
                        data = chartData.data
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = GetFullErrorMessage(ex) }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetWeeklyRevenueChart()
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    var revenueRows = (from a in db.tbl_appointments
                                       join s in db.tbl_services on a.service_id equals s.service_id
                                       join p in db.tbl_payments on a.appointment_id equals p.appointment_id
                                       where a.is_deleted == false
                                          && p.payment_status == "Approved"
                                       select new
                                       {
                                           a.appointment_date,
                                           s.fee
                                       }).ToList();

                    var weeklyRevenue = revenueRows
                        .GroupBy(r => r.appointment_date.Date.AddDays(-(int)r.appointment_date.DayOfWeek))
                        .Select(g => new
                        {
                            WeekStart = g.Key,
                            Revenue = g.Sum(x => x.fee)
                        })
                        .OrderByDescending(x => x.WeekStart)
                        .Take(8)
                        .OrderBy(x => x.WeekStart)
                        .ToList();

                    var chartData = new ChartWeeklyRevenueModel
                    {
                        labels = weeklyRevenue.Select(w => w.WeekStart.ToString("MMM dd")).ToList(),
                        data = weeklyRevenue.Select(w => w.Revenue).ToList()
                    };

                    return Json(new
                    {
                        success = true,
                        labels = chartData.labels,
                        data = chartData.data
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = GetFullErrorMessage(ex) }, JsonRequestBehavior.AllowGet);
            }
        }
        [HttpGet]
        public JsonResult GetPatients()
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    var patients = (from p in db.tbl_patients
                                    where p.is_deleted == false
                                    orderby p.first_name
                                    select new
                                    {
                                        PatientId = p.patient_id,
                                        FName = p.first_name,
                                        MName = p.middle_name,
                                        LName = p.last_name,
                                        Username = p.username,
                                        Gender = p.gender,
                                        BirthDateValue = p.date_of_birth
                                    }).ToList()
                                    .Select(p => new
                                    {
                                        p.PatientId,
                                        p.FName,
                                        p.MName,
                                        p.LName,
                                        p.Username,
                                        p.Gender,
                                        BirthDate = p.BirthDateValue.HasValue ? p.BirthDateValue.Value.ToString("yyyy-MM-dd") : ""
                                    }).ToList();

                    return Json(new { success = true, patients = patients }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult UpdatePatient(int PatientId, string FName, string MName,
                                        string LName, string Username, string Password)
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    bool usernameTaken = (from p in db.tbl_patients
                                          where p.username == Username
                                             && p.patient_id != PatientId
                                          select p).Any();

                    if (usernameTaken)
                        return Json(new { success = false, message = "Username already taken." });

                    var patient = (from p in db.tbl_patients
                                   where p.patient_id == PatientId
                                   select p).FirstOrDefault();

                    if (patient == null)
                        return Json(new { success = false, message = "Patient not found." });

                    patient.first_name = FName;
                    patient.middle_name = MName;
                    patient.last_name = LName;
                    patient.username = Username;
                    patient.updated_at = DateTime.Now;

                    if (!string.IsNullOrEmpty(Password))
                        patient.password_hash = HashPassword(Password);

                    db.SaveChanges();
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = GetFullErrorMessage(ex) });
            }
        }

        [HttpPost]
        public JsonResult DeletePatient(int PatientId)
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    var patient = (from p in db.tbl_patients
                                   where p.patient_id == PatientId
                                   select p).FirstOrDefault();

                    if (patient == null)
                        return Json(new { success = false, message = "Patient not found." });

                    patient.is_deleted = true;
                    patient.deleted_at = DateTime.Now;
                    db.SaveChanges();
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public JsonResult BookAppointment(int PatientId, string ApptTherapy,
                                  string ApptDate, string ApptTime)
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    if (string.IsNullOrEmpty(ApptDate) || string.IsNullOrEmpty(ApptTime))
                        return Json(new { success = false, message = "Date and time are required." });

                    DateTime parsedDate;
                    DateTime parsedTime;

                    if (!DateTime.TryParse(ApptDate, out parsedDate))
                        return Json(new { success = false, message = "Invalid appointment date." });

                    if (!DateTime.TryParse(ApptTime, out parsedTime))
                        return Json(new { success = false, message = "Invalid appointment time." });

                    using (var transaction = db.Database.BeginTransaction())
                    {
                        var service = (from s in db.tbl_services
                                       where s.service_name == ApptTherapy
                                          && s.is_active == true
                                       select s).FirstOrDefault();

                        if (service == null)
                            return Json(new { success = false, message = "Selected therapy service not found." });

                        var appointment = new tbl_appointment
                        {
                            patient_id = PatientId,
                            service_id = service.service_id,
                            appointment_date = parsedDate.Date,
                            appointment_time = parsedTime.TimeOfDay,
                            appt_status = "Pending",
                            is_deleted = false,
                            created_at = DateTime.Now
                        };

                        db.tbl_appointments.Add(appointment);
                        db.SaveChanges();

                        var receiptFile = Request.Files["ReceiptFile"];
                        if (receiptFile != null && receiptFile.ContentLength > 0)
                        {
                            string uploadFolder = Server.MapPath("~/Uploads/Receipts/");
                            if (!Directory.Exists(uploadFolder))
                                Directory.CreateDirectory(uploadFolder);

                            string fileName = "receipt_" + appointment.appointment_id + "_" + Path.GetFileName(receiptFile.FileName);
                            string filePath = Path.Combine(uploadFolder, fileName);
                            receiptFile.SaveAs(filePath);

                            string receiptPath = "/Uploads/Receipts/" + fileName;
                            db.tbl_payments.Add(new tbl_payment
                            {
                                appointment_id = appointment.appointment_id,
                                receipt_path = receiptPath,
                                payment_status = "Pending Review",
                                created_at = DateTime.Now
                            });

                            db.SaveChanges();
                        }

                        transaction.Commit();
                    }
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = GetFullErrorMessage(ex) });
            }
        }

        [HttpGet]
        public JsonResult GetAppointments()
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    var appointmentRows = (from a in db.tbl_appointments
                                           join p in db.tbl_patients on a.patient_id equals p.patient_id
                                           join s in db.tbl_services on a.service_id equals s.service_id
                                           join t in db.tbl_therapists on a.therapist_id equals t.therapist_id into tJoin
                                           from t in tJoin.DefaultIfEmpty()
                                           join pay in db.tbl_payments on a.appointment_id equals pay.appointment_id into payJoin
                                           from pay in payJoin.DefaultIfEmpty()
                                           where a.is_deleted == false
                                           orderby a.appointment_date descending
                                           select new
                                           {
                                               a.appointment_id,
                                               a.appointment_date,
                                               a.appointment_time,
                                               a.appt_status,
                                               a.therapist_id,
                                               p.first_name,
                                               p.last_name,
                                               s.service_name,
                                               s.fee,
                                               therapist_name = t != null ? t.full_name : null,
                                               payment_status = pay != null ? pay.payment_status : null,
                                               receipt_path = pay != null ? pay.receipt_path : null
                                           }).ToList();

                    var appointments = appointmentRows.Select(a => new
                    {
                        AppointmentId = a.appointment_id.ToString(),
                        ApptTherapistId = a.therapist_id.HasValue ? a.therapist_id.Value.ToString() : "",
                        ApptFName = a.first_name,
                        ApptLName = a.last_name,
                        ApptTherapy = a.service_name,
                        ApptTherapyFee = a.fee,
                        ApptDate = a.appointment_date.ToString("yyyy-MM-dd"),
                        ApptTime = FormatTime(a.appointment_time),
                        ApptStatus = a.appt_status,
                        ApptTherapist = a.therapist_name ?? "",
                        PaymentStatus = a.payment_status ?? "Unpaid",
                        ApptReceipt = a.receipt_path ?? ""
                    }).ToList();

                    return Json(new { success = true, appointments = appointments, count = appointments.Count }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult UpdateAppointment(int AppointmentId, string ApptTherapist,
                             string ApptStatus, string ApptDate, string ApptTime)
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    var appointment = (from a in db.tbl_appointments
                                       where a.appointment_id == AppointmentId
                                       select a).FirstOrDefault();

                    if (appointment == null)
                        return Json(new { success = false, message = "Appointment not found." });

                    DateTime parsedDate;
                    DateTime parsedTime;

                    if (!DateTime.TryParse(ApptDate, out parsedDate))
                        return Json(new { success = false, message = "Invalid appointment date." });

                    if (!DateTime.TryParse(ApptTime, out parsedTime))
                        return Json(new { success = false, message = "Invalid appointment time." });

                    appointment.appt_status = ApptStatus;
                    appointment.appointment_date = parsedDate.Date;
                    appointment.appointment_time = parsedTime.TimeOfDay;
                    appointment.therapist_id = string.IsNullOrEmpty(ApptTherapist)
                        ? (int?)null
                        : Convert.ToInt32(ApptTherapist);
                    appointment.updated_at = DateTime.Now;

                    db.SaveChanges();
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public JsonResult DeleteAppointment(int AppointmentId)
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    var appointment = (from a in db.tbl_appointments
                                       where a.appointment_id == AppointmentId
                                       select a).FirstOrDefault();

                    if (appointment == null)
                        return Json(new { success = false, message = "Appointment not found." });

                    appointment.is_deleted = true;
                    appointment.deleted_at = DateTime.Now;
                    db.SaveChanges();
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public JsonResult GetAvailableTherapistsCount()
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    int count = (from t in db.tbl_therapists
                                 where t.status == "Available"
                                    && t.is_deleted == false
                                 select t).Count();

                    return Json(new { success = true, count = count }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetPayments()
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    var paymentRows = (from a in db.tbl_appointments
                                       join p in db.tbl_patients on a.patient_id equals p.patient_id
                                       join s in db.tbl_services on a.service_id equals s.service_id
                                       join t in db.tbl_therapists on a.therapist_id equals t.therapist_id into tJoin
                                       from t in tJoin.DefaultIfEmpty()
                                       join pay in db.tbl_payments on a.appointment_id equals pay.appointment_id into payJoin
                                       from pay in payJoin.DefaultIfEmpty()
                                       where a.is_deleted == false
                                       orderby a.appointment_date descending
                                       select new
                                       {
                                           a.appointment_id,
                                           a.appointment_date,
                                           a.appointment_time,
                                           a.appt_status,
                                           p.first_name,
                                           p.last_name,
                                           p.date_of_birth,
                                           p.gender,
                                           p.contact_number,
                                           p.address,
                                           s.service_name,
                                           s.fee,
                                           therapist_name = t != null ? t.full_name : null,
                                           payment_id = pay != null ? (int?)pay.payment_id : null,
                                           receipt_path = pay != null ? pay.receipt_path : null,
                                           payment_status = pay != null ? pay.payment_status : null
                                       }).ToList();

                    var payments = paymentRows.Select(p => new
                    {
                        AppointmentId = p.appointment_id.ToString(),
                        PaymentId = p.payment_id.HasValue ? p.payment_id.Value.ToString() : "",
                        ApptFName = p.first_name,
                        ApptLName = p.last_name,
                        ApptDOB = p.date_of_birth.HasValue ? p.date_of_birth.Value.ToString("yyyy-MM-dd") : "",
                        ApptSex = p.gender,
                        ApptContact = p.contact_number,
                        ApptAddress = p.address,
                        ApptTherapy = p.service_name,
                        ApptDate = p.appointment_date.ToString("yyyy-MM-dd"),
                        ApptTime = FormatTime(p.appointment_time),
                        ApptStatus = p.appt_status,
                        ApptTherapist = p.therapist_name ?? "",
                        ApptTherapyFee = p.fee.ToString(),
                        ApptReceipt = p.receipt_path ?? "",
                        PaymentStatus = p.payment_status ?? "Unpaid"
                    }).ToList();

                    return Json(new { success = true, payments = payments }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult UpdatePaymentStatus(string PaymentId, string PaymentStatus)
        {
            try
            {
                int paymentId;
                if (!int.TryParse(PaymentId, out paymentId))
                    return Json(new { success = false, message = "Payment record not found." });

                using (var db = new RehabCareDBContext())
                {
                    var payment = (from p in db.tbl_payments
                                   where p.payment_id == paymentId
                                   select p).FirstOrDefault();

                    if (payment == null)
                        return Json(new { success = false, message = "Payment record not found." });

                    payment.payment_status = PaymentStatus;
                    payment.updated_at = DateTime.Now;
                    db.SaveChanges();
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public JsonResult GetTherapists()
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    var therapistRows = (from t in db.tbl_therapists
                                         join s in db.tbl_services on t.service_id equals s.service_id
                                         join sc in db.tbl_schedules on t.therapist_id equals sc.therapist_id into scJoin
                                         from sc in scJoin.DefaultIfEmpty()
                                         where t.is_deleted == false
                                         orderby t.full_name
                                         select new
                                         {
                                             t.therapist_id,
                                             t.full_name,
                                             t.status,
                                             s.service_name,
                                             day_of_week = sc != null ? (int?)sc.day_of_week : null,
                                             time_from = sc != null ? (TimeSpan?)sc.time_from : null,
                                             time_to = sc != null ? (TimeSpan?)sc.time_to : null
                                         }).ToList();

                    var dayMap = new Dictionary<int, string> {
                        {1, "Mon"}, {2, "Tue"}, {3, "Wed"}, {4, "Thu"},
                        {5, "Fri"}, {6, "Sat"}, {0, "Sun"}
                    };

                    var therapists = therapistRows
                        .GroupBy(t => new { t.therapist_id, t.full_name, t.status, t.service_name })
                        .Select(g =>
                        {
                            var dayList = g.Where(x => x.day_of_week.HasValue)
                                .OrderBy(x => x.day_of_week.Value)
                                .Select(x => dayMap.ContainsKey(x.day_of_week.Value) ? dayMap[x.day_of_week.Value] : "")
                                .Where(x => !string.IsNullOrEmpty(x))
                                .Distinct()
                                .ToList();

                            TimeSpan? timeFrom = g.Where(x => x.time_from.HasValue).Select(x => (TimeSpan?)x.time_from.Value).Min();
                            TimeSpan? timeTo = g.Where(x => x.time_to.HasValue).Select(x => (TimeSpan?)x.time_to.Value).Max();

                            return new
                            {
                                TherapistId = g.Key.therapist_id.ToString(),
                                TherapistName = g.Key.full_name,
                                TherapistSpecialty = g.Key.service_name,
                                TherapistDays = dayList,
                                TherapistTimeFrom = timeFrom.HasValue ? FormatTime(timeFrom.Value) : "",
                                TherapistTimeTo = timeTo.HasValue ? FormatTime(timeTo.Value) : "",
                                TherapistStatus = g.Key.status
                            };
                        }).ToList();

                    return Json(new { success = true, therapists = therapists }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult SaveTherapist(string TherapistId, string TherapistName, string TherapistSpecialty,
                                        string TherapistDays, string TherapistTimeFrom,
                                        string TherapistTimeTo, string TherapistStatus)
        {
            try
            {
                var dayMap = new Dictionary<string, int> {
                    {"Mon", 1}, {"Tue", 2}, {"Wed", 3}, {"Thu", 4},
                    {"Fri", 5}, {"Sat", 6}, {"Sun", 0}
                };

                var days = string.IsNullOrEmpty(TherapistDays)
                    ? new List<string>()
                    : new List<string>(TherapistDays.Split(','));

                using (var db = new RehabCareDBContext())
                {
                    var service = (from s in db.tbl_services
                                   where s.service_name == TherapistSpecialty
                                      && s.is_active == true
                                   select s).FirstOrDefault();

                    if (service == null)
                        return Json(new { success = false, message = "Service not found." });

                    DateTime parsedFrom = DateTime.Parse(TherapistTimeFrom);
                    DateTime parsedTo = DateTime.Parse(TherapistTimeTo);
                    TimeSpan timeFrom = parsedFrom.TimeOfDay;
                    TimeSpan timeTo = parsedTo.TimeOfDay;

                    int therapistId;
                    tbl_therapist therapist;

                    if (string.IsNullOrEmpty(TherapistId) || TherapistId == "0")
                    {
                        therapist = new tbl_therapist
                        {
                            full_name = TherapistName,
                            service_id = service.service_id,
                            status = TherapistStatus,
                            is_deleted = false,
                            created_at = DateTime.Now
                        };

                        db.tbl_therapists.Add(therapist);
                        db.SaveChanges();
                        therapistId = therapist.therapist_id;
                    }
                    else
                    {
                        therapistId = Convert.ToInt32(TherapistId);
                        therapist = (from t in db.tbl_therapists
                                     where t.therapist_id == therapistId
                                     select t).FirstOrDefault();

                        if (therapist == null)
                            return Json(new { success = false, message = "Therapist not found." });

                        therapist.full_name = TherapistName;
                        therapist.service_id = service.service_id;
                        therapist.status = TherapistStatus;
                        therapist.updated_at = DateTime.Now;

                        var oldSchedules = (from sc in db.tbl_schedules
                                            where sc.therapist_id == therapistId
                                            select sc).ToList();
                        db.tbl_schedules.RemoveRange(oldSchedules);
                    }

                    foreach (var day in days)
                    {
                        var trimmed = day.Trim();
                        if (!dayMap.ContainsKey(trimmed)) continue;

                        db.tbl_schedules.Add(new tbl_schedule
                        {
                            therapist_id = therapistId,
                            day_of_week = dayMap[trimmed],
                            time_from = timeFrom,
                            time_to = timeTo,
                            created_at = DateTime.Now
                        });
                    }

                    db.SaveChanges();
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public JsonResult DeleteTherapist(int TherapistId)
        {
            try
            {
                using (var db = new RehabCareDBContext())
                {
                    var therapist = (from t in db.tbl_therapists
                                     where t.therapist_id == TherapistId
                                     select t).FirstOrDefault();

                    if (therapist == null)
                        return Json(new { success = false, message = "Therapist not found." });

                    therapist.is_deleted = true;
                    therapist.deleted_at = DateTime.Now;
                    db.SaveChanges();
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        private static string HashPassword(string password)
        {
            using (var sha = SHA256.Create())
            {
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password ?? ""));
                return BitConverter.ToString(bytes).Replace("-", "").ToLower();
            }
        }

        private static string FormatTime(TimeSpan time)
        {
            return DateTime.Today.Add(time).ToString("HH:mm:ss");
        }

        private static string GetFullErrorMessage(Exception ex)
        {
            var messages = new List<string>();

            while (ex != null)
            {
                messages.Add(ex.Message);
                ex = ex.InnerException;
            }

            return string.Join(" | ", messages);
        }
    }
}



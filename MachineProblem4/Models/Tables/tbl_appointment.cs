using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MachineProblem4.Models.Tables
{
    [Table("tbl_appointments")]
    public class tbl_appointment
    {
        [Key]
        public int appointment_id { get; set; }

        public int patient_id { get; set; }
        public int service_id { get; set; }
        public int? therapist_id { get; set; }
        public DateTime appointment_date { get; set; }
        public TimeSpan appointment_time { get; set; }
        public string appt_status { get; set; }
        public bool is_deleted { get; set; }
        public DateTime? created_at { get; set; }
        public DateTime? updated_at { get; set; }
        public DateTime? deleted_at { get; set; }
    }
}

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MachineProblem4.Models.Tables
{
    [Table("tbl_patients")]
    public class tbl_patient
    {
        [Key]
        public int patient_id { get; set; }

        public string first_name { get; set; }
        public string middle_name { get; set; }
        public string last_name { get; set; }
        public DateTime? date_of_birth { get; set; }
        public string gender { get; set; }
        public string contact_number { get; set; }
        public string address { get; set; }
        public string username { get; set; }
        public string password_hash { get; set; }
        public bool is_deleted { get; set; }
        public bool is_active { get; set; }
        public DateTime? created_at { get; set; }
        public DateTime? updated_at { get; set; }
        public DateTime? deleted_at { get; set; }
    }
}

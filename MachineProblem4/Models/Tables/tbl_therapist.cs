using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MachineProblem4.Models.Tables
{
    [Table("tbl_therapists")]
    public class tbl_therapist
    {
        [Key]
        public int therapist_id { get; set; }

        public string full_name { get; set; }
        public int service_id { get; set; }
        public string status { get; set; }
        public bool is_deleted { get; set; }
        public DateTime? created_at { get; set; }
        public DateTime? updated_at { get; set; }
        public DateTime? deleted_at { get; set; }
    }
}

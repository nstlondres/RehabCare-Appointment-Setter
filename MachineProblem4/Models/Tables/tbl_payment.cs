using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MachineProblem4.Models.Tables
{
    [Table("tbl_payments")]
    public class tbl_payment
    {
        [Key]
        public int payment_id { get; set; }

        public int appointment_id { get; set; }
        public string receipt_path { get; set; }
        public string payment_status { get; set; }
        public DateTime? created_at { get; set; }
        public DateTime? updated_at { get; set; }
    }
}

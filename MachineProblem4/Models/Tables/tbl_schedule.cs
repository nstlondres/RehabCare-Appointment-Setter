using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MachineProblem4.Models.Tables
{
    [Table("tbl_schedules")]
    public class tbl_schedule
    {
        [Key]
        public int schedule_id { get; set; }

        public int therapist_id { get; set; }
        public int day_of_week { get; set; }
        public TimeSpan time_from { get; set; }
        public TimeSpan time_to { get; set; }
        public DateTime? created_at { get; set; }
    }
}

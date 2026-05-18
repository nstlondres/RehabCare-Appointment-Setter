using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MachineProblem4.Models.Tables
{
    [Table("tbl_services")]
    public class tbl_service
    {
        [Key]
        public int service_id { get; set; }

        public string service_name { get; set; }
        public decimal fee { get; set; }
        public bool is_active { get; set; }
    }
}

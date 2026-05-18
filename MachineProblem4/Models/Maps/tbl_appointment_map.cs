using System.Data.Entity.ModelConfiguration;
using MachineProblem4.Models.Tables;

namespace MachineProblem4.Models.Maps
{
    public class tbl_appointment_map : EntityTypeConfiguration<tbl_appointment>
    {
        public tbl_appointment_map()
        {
            HasKey(a => a.appointment_id);
            ToTable("tbl_appointments");
        }
    }
}

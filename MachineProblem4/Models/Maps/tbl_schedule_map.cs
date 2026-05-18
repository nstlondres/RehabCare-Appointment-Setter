using System.Data.Entity.ModelConfiguration;
using MachineProblem4.Models.Tables;

namespace MachineProblem4.Models.Maps
{
    public class tbl_schedule_map : EntityTypeConfiguration<tbl_schedule>
    {
        public tbl_schedule_map()
        {
            HasKey(s => s.schedule_id);
            ToTable("tbl_schedules");
        }
    }
}

using System.Data.Entity.ModelConfiguration;
using MachineProblem4.Models.Tables;

namespace MachineProblem4.Models.Maps
{
    public class tbl_service_map : EntityTypeConfiguration<tbl_service>
    {
        public tbl_service_map()
        {
            HasKey(s => s.service_id);
            ToTable("tbl_services");
        }
    }
}

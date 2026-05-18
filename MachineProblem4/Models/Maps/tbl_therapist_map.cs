using System.Data.Entity.ModelConfiguration;
using MachineProblem4.Models.Tables;

namespace MachineProblem4.Models.Maps
{
    public class tbl_therapist_map : EntityTypeConfiguration<tbl_therapist>
    {
        public tbl_therapist_map()
        {
            HasKey(t => t.therapist_id);
            ToTable("tbl_therapists");
        }
    }
}

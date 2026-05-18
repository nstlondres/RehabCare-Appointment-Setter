using System.Data.Entity.ModelConfiguration;
using MachineProblem4.Models.Tables;

namespace MachineProblem4.Models.Maps
{
    public class tbl_patient_map : EntityTypeConfiguration<tbl_patient>
    {
        public tbl_patient_map()
        {
            HasKey(p => p.patient_id);
            ToTable("tbl_patients");
        }
    }
}

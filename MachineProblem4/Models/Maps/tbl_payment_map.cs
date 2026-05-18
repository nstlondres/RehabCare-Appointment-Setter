using System.Data.Entity.ModelConfiguration;
using MachineProblem4.Models.Tables;

namespace MachineProblem4.Models.Maps
{
    public class tbl_payment_map : EntityTypeConfiguration<tbl_payment>
    {
        public tbl_payment_map()
        {
            HasKey(p => p.payment_id);
            ToTable("tbl_payments");
        }
    }
}

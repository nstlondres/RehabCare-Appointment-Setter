using System.Data.Entity;
using MachineProblem4.Models.Maps;
using MachineProblem4.Models.Tables;
using MySql.Data.EntityFramework;

namespace MachineProblem4.Models
{
    [DbConfigurationType(typeof(MySqlEFConfiguration))]
    public class RehabCareDBContext : DbContext
    {
        static RehabCareDBContext()
        {
            System.Data.Entity.Database.SetInitializer<RehabCareDBContext>(null);
        }

        public RehabCareDBContext() : base("name=RehabCareDB")
        {
        }

        public DbSet<tbl_patient> tbl_patients { get; set; }
        public DbSet<tbl_appointment> tbl_appointments { get; set; }
        public DbSet<tbl_service> tbl_services { get; set; }
        public DbSet<tbl_therapist> tbl_therapists { get; set; }
        public DbSet<tbl_payment> tbl_payments { get; set; }
        public DbSet<tbl_schedule> tbl_schedules { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Configurations.Add(new tbl_patient_map());
            modelBuilder.Configurations.Add(new tbl_appointment_map());
            modelBuilder.Configurations.Add(new tbl_service_map());
            modelBuilder.Configurations.Add(new tbl_therapist_map());
            modelBuilder.Configurations.Add(new tbl_payment_map());
            modelBuilder.Configurations.Add(new tbl_schedule_map());

            base.OnModelCreating(modelBuilder);
        }
    }
}

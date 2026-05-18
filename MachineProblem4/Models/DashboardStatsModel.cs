using System.Collections.Generic;

namespace MachineProblem4.Models
{
    public class DashboardStatsModel
    {
        public int totalPatients { get; set; }
        public int totalAppointments { get; set; }
        public int todaysAppointments { get; set; }
        public int availableTherapists { get; set; }
        public int pendingReview { get; set; }
        public int approvedPayments { get; set; }
    }

    public class ChartTherapyAppointmentModel
    {
        public List<string> labels { get; set; }
        public List<int> data { get; set; }
    }

    public class ChartAppointmentStatusModel
    { 
        public List<string> labels { get; set; }
        public List<int> data { get; set; }
    }

    public class ChartWeeklyRevenueModel
    {
        public List<string> labels { get; set; }
        public List<decimal> data { get; set; }
    }
}

using System.Web;
using System.Web.Optimization;

namespace MachineProblem4
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            // ── jQuery (already existed) ──────────────────────────────
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include(
                        "~/Scripts/jquery.validate*"));

            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));

            // ── Bootstrap JS (already existed) ───────────────────────
            bundles.Add(new Bundle("~/bundles/bootstrap").Include(
                      "~/Scripts/bootstrap.js"));

            // ── Medic Template JS ─────────────────────────────────────
            bundles.Add(new ScriptBundle("~/bundles/medic-scripts").Include(
                      "~/Scripts/slick.min.js",
                      "~/Scripts/jquery.fancybox.min.js",
                      "~/Scripts/medic.js"));

            // ── CSS: Bootstrap + Site + Medic Template ────────────────
            bundles.Add(new StyleBundle("~/Content/css").Include(
                      "~/Content/bootstrap.css",
                      "~/Content/animate.min.css",
                      "~/Content/slick.css",
                      "~/Content/slick-theme.css",
                      "~/Content/jquery.fancybox.min.css",
                      "~/Content/fontawesome/css/all.min.css",
                      "~/Content/style.css",   // Medic custom styles — must be last
                      "~/Content/site.css"));
        }
    }
}
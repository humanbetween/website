import { headers } from "next/headers";
import {
  User,
  Shield,
  Megaphone,
  DollarSign,
  Sparkles,
  Home,
  Share2,
  Rocket,
  Link2,
  Tags,
} from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getPricingBanner,
  getPricingPlans,
  getPromoCard,
  getHeroContent,
  getSocialLinks,
  getHomeCtaBanner,
  getHeaderCta,
  getPromptCategories,
} from "@/lib/site-settings";
import { AdminPageHeader, AdminCard } from "@/components/admin/AdminShell";
import { UpdatePasswordForm } from "./UpdatePasswordForm";
import { BannerSettingsForm } from "./BannerSettingsForm";
import { PlansSettingsForm } from "./PlansSettingsForm";
import { PromoSettingsForm } from "./PromoSettingsForm";
import { HeroSettingsForm } from "./HeroSettingsForm";
import { SocialLinksForm } from "./SocialLinksForm";
import { HomeCtaBannerForm } from "./HomeCtaBannerForm";
import { HeaderCtaForm } from "./HeaderCtaForm";
import { CategoriesForm } from "./CategoriesForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [
    session,
    banner,
    plans,
    promo,
    hero,
    social,
    ctaBanner,
    headerCta,
    categories,
  ] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getPricingBanner(),
    getPricingPlans(),
    getPromoCard(),
    getHeroContent(),
    getSocialLinks(),
    getHomeCtaBanner(),
    getHeaderCta(),
    getPromptCategories(),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <AdminPageHeader
        eyebrow="System &amp; preferences"
        title="Global settings"
        subtitle="Manage your admin account and what visitors see on /pricing."
      />

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <AdminCard>
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium tracking-tight">
              Profile identity
            </h2>
          </div>
          <div className="px-5 py-6 flex flex-col gap-4">
            <Field label="Full name" value={session?.user.name ?? "—"} />
            <Field label="Email" value={session?.user.email ?? "—"} />
            <p className="text-[11px] text-muted-foreground">
              Editing name and email is coming soon. For now, contact support
              to change either.
            </p>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium tracking-tight">
              Security &amp; access
            </h2>
          </div>
          <div className="px-5 py-6">
            <UpdatePasswordForm />
          </div>
        </AdminCard>
      </div>

      <AdminCard className="mb-6">
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
          <Home className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium tracking-tight">
            Home hero copy
          </h2>
        </div>
        <div className="px-5 py-6">
          <HeroSettingsForm initial={hero} />
        </div>
      </AdminCard>

      <AdminCard className="mb-6">
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium tracking-tight">
            Header button (Skool / Instagram / community)
          </h2>
        </div>
        <div className="px-5 py-6">
          <HeaderCtaForm initial={headerCta} />
        </div>
      </AdminCard>

      <AdminCard className="mb-6">
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium tracking-tight">
            Pricing
          </h2>
        </div>
        <div className="px-5 py-6">
          <PlansSettingsForm initial={plans} />
        </div>
      </AdminCard>

      <AdminCard className="mb-6">
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium tracking-tight">
            Pricing page banner
          </h2>
        </div>
        <div className="px-5 py-6">
          <BannerSettingsForm initial={banner} />
        </div>
      </AdminCard>

      <AdminCard className="mb-6">
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
          <Tags className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium tracking-tight">
            Categories &amp; subcategories
          </h2>
        </div>
        <div className="px-5 py-6">
          <CategoriesForm initial={categories} />
        </div>
      </AdminCard>

      <AdminCard className="mb-6">
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium tracking-tight">
            Home grid promo card
          </h2>
        </div>
        <div className="px-5 py-6">
          <PromoSettingsForm initial={promo} />
        </div>
      </AdminCard>

      <AdminCard className="mb-6">
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
          <Rocket className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium tracking-tight">
            Home bottom CTA banner
          </h2>
        </div>
        <div className="px-5 py-6">
          <HomeCtaBannerForm initial={ctaBanner} />
        </div>
      </AdminCard>

      <AdminCard>
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
          <Share2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium tracking-tight">
            Social media links
          </h2>
        </div>
        <div className="px-5 py-6">
          <SocialLinksForm initial={social} />
        </div>
      </AdminCard>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <div className="px-3 py-2 rounded-lg bg-input/40 border border-border/60 text-sm">
        {value}
      </div>
    </div>
  );
}

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ContactBubble } from "@/components/site/ContactBubble";
import { CategoriesProvider } from "@/components/prompts/CategoriesContext";
import { getPromptCategories } from "@/lib/site-settings";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getPromptCategories();
  return (
    <CategoriesProvider categories={categories}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ContactBubble />
    </CategoriesProvider>
  );
}

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { blogPosts, getPost } from "@/lib/blog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: `${post.title} · UMAXES`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 bg-umx-cream">
        <article className="px-4 pb-20 pt-[8.5rem] sm:px-6 sm:pb-28 sm:pt-[9rem]">
          <div className="mx-auto max-w-[720px]">
            <Link
              href="/#news"
              className="font-display text-sm font-semibold text-umx-orange transition hover:text-umx-orange-deep"
            >
              ← News & Events
            </Link>

            <div className="mt-8 flex items-center gap-3 font-display text-xs font-semibold tracking-[0.14em] uppercase">
              <span className="text-umx-orange">{post.category}</span>
              <span className="text-black/25">·</span>
              <time dateTime={post.date} className="text-black/40">
                {post.dateLabel}
              </time>
            </div>

            <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-black">
              {post.title}
            </h1>
            <p className="mt-4 font-body text-lg leading-relaxed text-black/65">
              {post.excerpt}
            </p>

            <div className="relative mt-10 aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-umx-cream-warm shadow-[0_16px_44px_rgba(61,22,5,0.1)] ring-1 ring-black/6">
              <Image
                src={post.image}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 720px) 100vw, 720px"
                priority
              />
            </div>

            <div className="mt-10 space-y-5 font-body text-base leading-relaxed text-black/75 sm:text-lg">
              {post.body.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-12 border-t border-black/8 pt-8">
              <Link
                href="/shop"
                className="inline-flex rounded-full bg-black px-7 py-3.5 font-display text-sm font-semibold text-umx-cream transition hover:bg-umx-orange hover:text-white"
              >
                Shop UMAXES
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

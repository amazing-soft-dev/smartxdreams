import { TransitionLink } from "@/components/transition/TransitionLink";
import { Section } from "@/components/ui/Section";
import { productBySlug } from "@/content/selectors";
import type { Product } from "@/content/types";
import { type Post, relatedPosts } from "@/lib/blog/posts";
import { PostTeaser } from "./PostTeaser";

/** The products a post is about, each linking to its page (and from there, its waitlist). */
function PostProducts({ products }: { products: Product[] }) {
  return (
    <div>
      <h2 id="post-products-title" className="text-h4">
        Products in this post
      </h2>
      <ul className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li key={product.slug}>
            <article
              data-product={product.slug}
              className="relative flex h-full flex-col rounded-[30px] bg-white p-6 outline-offset-4 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-violet-500"
            >
              <h3 className="text-h5">
                <TransitionLink
                  href={`/products/${product.slug}`}
                  className="outline-none after:absolute after:inset-0 after:rounded-[30px]"
                >
                  {product.name}
                </TransitionLink>
              </h3>
              <p className="mt-2 text-body text-ink/70">{product.tagline}</p>
              <p className="mt-auto pt-5 text-label font-medium text-violet-600">Waitlist open</p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** After the article: the products it covers and up to three posts to read next. Renders nothing when empty. */
export function PostAside({ post }: { post: Post }) {
  const products = post.products.map(productBySlug).filter((p): p is Product => p !== undefined);
  const related = relatedPosts(post);
  if (products.length === 0 && related.length === 0) return null;
  return (
    <Section surface="canvas" labelledBy={related.length > 0 ? "related-title" : "post-products-title"}>
      <div className="flex flex-col gap-20">
        {products.length > 0 ? <PostProducts products={products} /> : null}
        {related.length > 0 ? (
          <div>
            <h2 id="related-title" className="text-h4">
              Keep reading
            </h2>
            <ul className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {related.map((other) => (
                <li key={other.slug}>
                  <PostTeaser post={other} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

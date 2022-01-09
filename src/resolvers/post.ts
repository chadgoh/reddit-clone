import { Post } from "../entities/Post";
import { MyContext } from "src/types";
import { Resolver, Query, Ctx, Arg, Int, Mutation } from "type-graphql";

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  allPosts(@Ctx() ctx: MyContext): Promise<Post[]> {
    console.log("getting all posts")
    return ctx.em.find(Post, {});
  }

  @Query(() => Post, { nullable: true })
  postById(
    @Arg("id", () => Int) id: number,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    return em.findOne(Post, { id });
  }

  @Mutation(() => Post)
  async createPost(
    @Arg("title") title: String,
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  @Mutation(() => Post)
  async updatePost(
    @Arg("id") id: number,
    @Arg("title") title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | void> {
    try {
      const post = await em.findOneOrFail(Post, { id });

      if (typeof title != undefined && title != null) {
          if (title.length != 0 && title.trim().length != 0) {

              post.title = title;
              em.persistAndFlush(post);
              return post;
          }
          console.log("cannot provide empty string")
      }
      console.error("title cannot be undefined or null");
    } catch (e) {
      console.error("Failed to update post with id: ".concat(id.toString()));
    }
  }


  @Mutation(() => Post)
  async deletePost(
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<boolean> {
    try {
        await em.nativeDelete(Post, {id});
        return true;
    }
    catch (e) {
        console.log(e)
        return false;
    }
}
}

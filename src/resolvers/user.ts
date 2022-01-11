import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Resolver, Mutation, Arg, InputType, Field, Ctx, Query, ObjectType } from "type-graphql";
import argon2 from "argon2";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;

}

@ObjectType()
class UserResponse{
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[];

  @Field(() => User, {nullable: true})
  user?: User;
}

@Resolver()
export class UserResolver {

  @Query(() => User)
  async getUserByUsername(
    @Arg("username") username:string,
    @Ctx() {em}: MyContext
    ) {
    const user = em.findOne(User, {username});
    return user;
  }

  
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") {username, password}: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ) {

    if (username.length <= 2) {
      return {
        errors: [{
          field: 'username',
          message: "length must be greater than 2"
        }]
      }
    }

    if (password.length <= 8) {
      return {
        errors: [{
          field: 'password',
          message: "length must be greater than 8"
        }]
      }
    }
    const hashedPassword = await argon2.hash(password);
    const user = em.create(User, {
      username: username.toLowerCase(),
      password: hashedPassword,
    });
    try {
      
      await em.persistAndFlush(user);
    } catch (error) {
      console.log("error registering user. Error: ", error.message)
      if (error.detail.includes("already exists")) {
        return {
          errors: [{
            field: 'user',
            message: "User already exists"
          }]
        }
      } 
    }
    return {user};
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, {username: options.username.toLowerCase()});
    if (!user) {
      return {
        errors: [{
          field: 'Credentials',
          message: "Invalid Credentials"
        }]
      }
    }
    const valid = await argon2.verify(user.password, options.password);

    if (!valid) {
      return {
        errors: [{
          field: 'Credentials',
          message: "Invalid Credentials"
        }]
      }
    }

    return {user};
  }

  @Mutation(() => User)
  async deleteUserByUsername(
    @Arg("username") username: string,
    @Ctx() { em }: MyContext
  ) {
    
    em.nativeDelete(User,{username});
    
    return username.concat(" deleted successfully");
  }
}

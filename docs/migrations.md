# Migrations

* [How migrations are working](#how-migrations-are-working)
* [Creating a new migration](#creating-a-new-migration)
* [Running and reverting migrations](#running-and-reverting-migrations)
* [Generating migrations](#generating-migrations)
* [Using migration API to write migrations](#using-migration-api-to-write-migrations) [TBD]

## How migrations are working

Once you get into the production you'll need to synchronize model changes into the database.
Typically it is unsafe to use `synchronize: true` for schema synchronization on production once
you get data in your database. Here is where migrations come to help.

Migration is just a single file with sql queries written by you to update a database schema
and apply a new changes to exist database.

Let's say you already have a database and a post entity:

```typescript
@Entity()
export class Post {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    title: string;
    
    @Column()
    text: string;
    
}
```

And your entity worked in production for month without any changes.
You have thousands posts in your database.

Now you need to make a new release and rename `title` column to `name`.
What would you do? 

You need to create a new migration and put there following sql query (postgres dialect):

```sql
ALTER TABLE "post" ALTER COLUMN "title" RENAME TO "name";
```

Once you run this sql query your database schema is ready to work with new codebase.
TypeORM provides you a place where you can write such sql queries and run them when needed.
This place is called "migrations".

## Creating a new migration

Before creating a new migration you need to setup your connection options properly:

```json
{
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "username": "test",
    "password": "test",
    "database": "test",
    "entities": ["entity/*.js"],
    "migrations": ["migration/*.js"],
    "cli": {
        "migrationsDir": "migration"
    }
}
```

Here we setup two options:

* `"migrations": ["migration/*.js"]` - indicates that typeorm must load migrations from the given "migration" directory
* `"cli": { "migrationsDir": "migration" }` - indicates that CLI must create new migrations in the "migration" directory

Once you setup connection options you can create a new migration using CLI:

```
typeorm migrations:create -n PostRefactoring
```

To use CLI commands you need to install typeorm globally (`npm i typeorm -g`).
Also make sure your locally typeorm version matches globally installed.
For more information about typeorm CLI read documentation [here](./using-cli.md).

Here, `PostRefactoring` is the name of migration - you can specify any name you want.
After you run this command you can see a new file generated in "migration" directory, 
named `{TIMESTAMP}-PostRefactoring.ts` where `{TIMESTAMP}` is current timestamp when migration was generated.
Now you can open this file and add your migration sql queries there.

You should see following content inside your migration:

```typescript
import {MigrationInterface, QueryRunner} from "typeorm";

export class PostRefactoringTIMESTAMP implements MigrationInterface {
    
    async up(queryRunner: QueryRunner): Promise<any> {
        
    }

    async down(queryRunner: QueryRunner): Promise<any> { 
        
    }

    
}
```

There are two methods you must fill with your migration code: `up` and `down`.
In `up` method you must write all the code you need to perform migration.
In `down` method you must write all the code that reverts things made in `up` method.
`down` method is used when you screw things up and want to revert last migration.

Inside both `up` and `down` methods you have a `QueryRunner` object.
All database operations are executing using this object.
For more infromation about query runner see [this documentation](./query-runner.md).

Let's see how this migration will look like with our `Post` changes requirement:

```typescript
import {MigrationInterface, QueryRunner} from "typeorm";

export class PostRefactoringTIMESTAMP implements MigrationInterface {
    
    async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "post" ALTER COLUMN "title" RENAME TO "name"`);
    }

    async down(queryRunner: QueryRunner): Promise<any> { 
        await queryRunner.query(`ALTER TABLE "post" ALTER COLUMN "name" RENAME TO "title"`); // reverts things made in "up" method
    }

    
}
```

## Running and reverting migrations

Once you have a migration to run on production you can run the using CLI command:

```
typeorm migrations:run
```

This command will execute all pending migrations and run them in a sequence ordered by their timestamps.
It means all sql queries you wrote in `up` methods of your created migrations will be executed.
That's all! Now you have your database schema up-to-date.

If for some reason you screw things up you can revert last executed migration using CLI command:

```
typeorm migrations:revert
```

This command will execute `down` method in the latest executed migration. 
If you need to revert more you must call this command again and again, as much as needed to revert. 

## Generating migrations

TypeORM is able to automatically generate migration files with schema changes you made inside it.

Let's say you have `Post` entity with `title` column. And you have changed `title` column name to `name`.
You can run following command:

```
typeorm migrations:generate -n PostRefactoring
```

And it will generate a new migration called `{TIMESTAMP}-PostRefactoring.ts` with following content:

```typescript
import {MigrationInterface, QueryRunner} from "typeorm";

export class PostRefactoringTIMESTAMP implements MigrationInterface {
    
    async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "post" ALTER COLUMN "title" RENAME TO "name"`);
    }

    async down(queryRunner: QueryRunner): Promise<any> { 
        await queryRunner.query(`ALTER TABLE "post" ALTER COLUMN "name" RENAME TO "title"`);
    }

    
}
```

See, you don't need to write such queries on your own. 
The rule of thumb of generated migrations is that you generate them after "each" change you made to your models.

## Using migration API to write migrations

`QueryRunner` interface is not completely stable yet. 
This section is TBD in future versions of TypeORM.
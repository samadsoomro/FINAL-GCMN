CREATE TYPE "public"."app_role" AS ENUM('admin', 'moderator', 'user');--> statement-breakpoint
CREATE TABLE "book_borrows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"book_id" text NOT NULL,
	"book_title" text NOT NULL,
	"borrower_name" text NOT NULL,
	"borrower_phone" text,
	"borrower_email" text,
	"borrow_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"return_date" timestamp with time zone,
	"status" text DEFAULT 'borrowed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_name" text NOT NULL,
	"short_intro" text NOT NULL,
	"description" text NOT NULL,
	"book_image" text,
	"total_copies" numeric(10, 0) DEFAULT '1' NOT NULL,
	"available_copies" numeric(10, 0) DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"is_seen" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" text NOT NULL,
	"name" text,
	"email" text,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"images" text[],
	"date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_card_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"father_name" text,
	"dob" date,
	"class" text NOT NULL,
	"field" text,
	"roll_no" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address_street" text NOT NULL,
	"address_city" text NOT NULL,
	"address_state" text NOT NULL,
	"address_zip" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"password" text,
	"card_number" text,
	"student_id" text,
	"issue_date" date,
	"valid_through" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_card_applications_card_number_unique" UNIQUE("card_number")
);
--> statement-breakpoint
CREATE TABLE "non_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"subject" text NOT NULL,
	"class" text NOT NULL,
	"pdf_path" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"image" text,
	"pin" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"roll_number" text,
	"department" text,
	"student_class" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "rare_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"pdf_path" text NOT NULL,
	"cover_image" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" text NOT NULL,
	"name" text NOT NULL,
	"class" text,
	"field" text,
	"roll_no" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_card_id_unique" UNIQUE("card_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "app_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

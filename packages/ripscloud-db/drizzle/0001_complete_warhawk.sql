CREATE TABLE `rips_admin_migration_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`summary_json` text DEFAULT '{}' NOT NULL,
	`error_message` text
);
--> statement-breakpoint
CREATE INDEX `rips_admin_migration_runs_status_idx` ON `rips_admin_migration_runs` (`status`);--> statement-breakpoint
CREATE INDEX `rips_admin_migration_runs_started_idx` ON `rips_admin_migration_runs` (`started_at`);--> statement-breakpoint
CREATE TABLE `rips_admin_refresh_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`replaced_by_token_hash` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `rips_admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rips_admin_refresh_tokens_token_hash_unique` ON `rips_admin_refresh_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `rips_admin_refresh_tokens_user_idx` ON `rips_admin_refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `rips_admin_refresh_tokens_expires_idx` ON `rips_admin_refresh_tokens` (`expires_at`);--> statement-breakpoint
CREATE TABLE `rips_admin_tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`do_name` text NOT NULL,
	`nit` text NOT NULL,
	`verification_digit` text NOT NULL,
	`company_name` text NOT NULL,
	`commercial_name` text,
	`tax_regime` text,
	`economic_activity_code` text,
	`address` text,
	`department_code` text,
	`municipality_code` text,
	`phone_number` text,
	`email` text,
	`service_code` text,
	`invoice_provider` text DEFAULT 'monaros' NOT NULL,
	`environment` integer DEFAULT 2 NOT NULL,
	`logo_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rips_admin_tenants_slug_unique` ON `rips_admin_tenants` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `rips_admin_tenants_do_name_unique` ON `rips_admin_tenants` (`do_name`);--> statement-breakpoint
CREATE INDEX `rips_admin_tenants_company_name_idx` ON `rips_admin_tenants` (`company_name`);--> statement-breakpoint
CREATE INDEX `rips_admin_tenants_is_active_idx` ON `rips_admin_tenants` (`is_active`);--> statement-breakpoint
CREATE TABLE `rips_admin_user_tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `rips_admin_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tenant_id`) REFERENCES `rips_admin_tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rips_admin_user_tenants_user_tenant_unique` ON `rips_admin_user_tenants` (`user_id`,`tenant_id`);--> statement-breakpoint
CREATE INDEX `rips_admin_user_tenants_tenant_idx` ON `rips_admin_user_tenants` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `rips_admin_user_tenants_user_idx` ON `rips_admin_user_tenants` (`user_id`);--> statement-breakpoint
CREATE TABLE `rips_admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`first_name` text DEFAULT '' NOT NULL,
	`last_name` text DEFAULT '' NOT NULL,
	`password_hash` text,
	`google_subject` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rips_admin_users_email_unique` ON `rips_admin_users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `rips_admin_users_google_subject_unique` ON `rips_admin_users` (`google_subject`);--> statement-breakpoint
CREATE INDEX `rips_admin_users_is_active_idx` ON `rips_admin_users` (`is_active`);
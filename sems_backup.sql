--
-- PostgreSQL database dump
--

\restrict dZ54NzGfidr5DLKvBGenIJEnDhVPyximmM7uUbPe2vgn6F7gQm4eoykyOzFO33h

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ActivityLog; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."ActivityLog" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    action text NOT NULL,
    resource text NOT NULL,
    "resourceId" text,
    changes text,
    "ipAddress" text,
    "userAgent" text,
    status text DEFAULT 'success'::text NOT NULL,
    "errorMsg" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ActivityLog" OWNER TO sems;

--
-- Name: ActivityLog_id_seq; Type: SEQUENCE; Schema: public; Owner: sems
--

CREATE SEQUENCE public."ActivityLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ActivityLog_id_seq" OWNER TO sems;

--
-- Name: ActivityLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sems
--

ALTER SEQUENCE public."ActivityLog_id_seq" OWNED BY public."ActivityLog".id;


--
-- Name: ApiKey; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."ApiKey" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastUsed" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ApiKey" OWNER TO sems;

--
-- Name: ApiKey_id_seq; Type: SEQUENCE; Schema: public; Owner: sems
--

CREATE SEQUENCE public."ApiKey_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ApiKey_id_seq" OWNER TO sems;

--
-- Name: ApiKey_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sems
--

ALTER SEQUENCE public."ApiKey_id_seq" OWNED BY public."ApiKey".id;


--
-- Name: DispenseRecord; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."DispenseRecord" (
    id integer NOT NULL,
    "externalId" text NOT NULL,
    "userId" integer NOT NULL,
    "patientName" text,
    "patientAge" integer,
    "patientWeight" double precision,
    "drugId" text NOT NULL,
    "drugName" text NOT NULL,
    dose text NOT NULL,
    "safetyAcks" text NOT NULL,
    "printedAt" timestamp(3) without time zone,
    "deviceId" text NOT NULL,
    "auditLog" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "patientPhoneNumber" text
);


ALTER TABLE public."DispenseRecord" OWNER TO sems;

--
-- Name: DispenseRecord_id_seq; Type: SEQUENCE; Schema: public; Owner: sems
--

CREATE SEQUENCE public."DispenseRecord_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DispenseRecord_id_seq" OWNER TO sems;

--
-- Name: DispenseRecord_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sems
--

ALTER SEQUENCE public."DispenseRecord_id_seq" OWNED BY public."DispenseRecord".id;


--
-- Name: DoseRegimen; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."DoseRegimen" (
    id text NOT NULL,
    "drugId" text NOT NULL,
    "ageMin" integer,
    "ageMax" integer,
    "weightMin" double precision,
    "weightMax" double precision,
    "ageGroup" text DEFAULT 'adult'::text NOT NULL,
    "doseMg" text NOT NULL,
    frequency text NOT NULL,
    duration text NOT NULL,
    "maxDoseMgDay" text,
    route text DEFAULT 'oral'::text NOT NULL,
    instructions text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DoseRegimen" OWNER TO sems;

--
-- Name: Drug; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."Drug" (
    id text NOT NULL,
    "genericName" text NOT NULL,
    "tradeName" text[],
    strength text NOT NULL,
    route text DEFAULT 'oral'::text NOT NULL,
    category text NOT NULL,
    "stgReference" text,
    contraindications text[],
    "pregnancyCategory" text,
    warnings text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Drug" OWNER TO sems;

--
-- Name: Permission; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."Permission" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Permission" OWNER TO sems;

--
-- Name: Permission_id_seq; Type: SEQUENCE; Schema: public; Owner: sems
--

CREATE SEQUENCE public."Permission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Permission_id_seq" OWNER TO sems;

--
-- Name: Permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sems
--

ALTER SEQUENCE public."Permission_id_seq" OWNED BY public."Permission".id;


--
-- Name: PrintTemplate; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."PrintTemplate" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "htmlTemplate" text NOT NULL,
    "escposTemplate" text,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PrintTemplate" OWNER TO sems;

--
-- Name: Printer; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."Printer" (
    id integer NOT NULL,
    name text NOT NULL,
    location text,
    "ipAddress" text,
    "modelNumber" text,
    "serialNumber" text,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastSync" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Printer" OWNER TO sems;

--
-- Name: PrinterSettings; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."PrinterSettings" (
    id integer NOT NULL,
    "printerId" integer NOT NULL,
    "paperSize" text DEFAULT 'A4'::text NOT NULL,
    orientation text DEFAULT 'portrait'::text NOT NULL,
    "colorMode" text DEFAULT 'bw'::text NOT NULL,
    quality text DEFAULT 'normal'::text NOT NULL,
    copies integer DEFAULT 1 NOT NULL,
    "autoSync" boolean DEFAULT true NOT NULL,
    "syncInterval" integer DEFAULT 300 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PrinterSettings" OWNER TO sems;

--
-- Name: PrinterSettings_id_seq; Type: SEQUENCE; Schema: public; Owner: sems
--

CREATE SEQUENCE public."PrinterSettings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PrinterSettings_id_seq" OWNER TO sems;

--
-- Name: PrinterSettings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sems
--

ALTER SEQUENCE public."PrinterSettings_id_seq" OWNED BY public."PrinterSettings".id;


--
-- Name: Printer_id_seq; Type: SEQUENCE; Schema: public; Owner: sems
--

CREATE SEQUENCE public."Printer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Printer_id_seq" OWNER TO sems;

--
-- Name: Printer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sems
--

ALTER SEQUENCE public."Printer_id_seq" OWNED BY public."Printer".id;


--
-- Name: Role; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."Role" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Role" OWNER TO sems;

--
-- Name: Role_id_seq; Type: SEQUENCE; Schema: public; Owner: sems
--

CREATE SEQUENCE public."Role_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Role_id_seq" OWNER TO sems;

--
-- Name: Role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sems
--

ALTER SEQUENCE public."Role_id_seq" OWNED BY public."Role".id;


--
-- Name: SMTPSettings; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."SMTPSettings" (
    id text NOT NULL,
    host text NOT NULL,
    port integer NOT NULL,
    secure boolean DEFAULT true NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    "fromEmail" text NOT NULL,
    "fromName" text NOT NULL,
    "adminEmail" text NOT NULL,
    "replyToEmail" text,
    enabled boolean DEFAULT false NOT NULL,
    "testStatus" text,
    "lastTestedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SMTPSettings" OWNER TO sems;

--
-- Name: SystemSettings; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."SystemSettings" (
    id integer NOT NULL,
    "facilityName" text NOT NULL,
    "facilityLogo" text,
    address text,
    "phoneNumber" text,
    email text,
    "autoSyncEnabled" boolean DEFAULT true NOT NULL,
    "syncInterval" integer DEFAULT 300 NOT NULL,
    "dataRetention" integer DEFAULT 365 NOT NULL,
    "dataRetentionUnit" text DEFAULT 'days'::text NOT NULL,
    "auditLogging" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemSettings" OWNER TO sems;

--
-- Name: SystemSettings_id_seq; Type: SEQUENCE; Schema: public; Owner: sems
--

CREATE SEQUENCE public."SystemSettings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SystemSettings_id_seq" OWNER TO sems;

--
-- Name: SystemSettings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sems
--

ALTER SEQUENCE public."SystemSettings_id_seq" OWNED BY public."SystemSettings".id;


--
-- Name: Ticket; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."Ticket" (
    id text NOT NULL,
    "ticketNumber" text NOT NULL,
    "userId" integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    attachments text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "closedAt" timestamp(3) without time zone
);


ALTER TABLE public."Ticket" OWNER TO sems;

--
-- Name: TicketNote; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."TicketNote" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "userId" integer NOT NULL,
    content text NOT NULL,
    "isAdminNote" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TicketNote" OWNER TO sems;

--
-- Name: TicketNotification; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."TicketNotification" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "userId" integer NOT NULL,
    type text DEFAULT 'ticket-updated'::text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TicketNotification" OWNER TO sems;

--
-- Name: User; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    email text NOT NULL,
    "fullName" text NOT NULL,
    phone text,
    password text NOT NULL,
    "licenseNumber" text NOT NULL,
    specialization text,
    theme text DEFAULT 'auto'::text NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    "defaultDoseUnit" text DEFAULT 'mg'::text NOT NULL,
    "autoLock" boolean DEFAULT false NOT NULL,
    "autoLockMinutes" integer DEFAULT 15 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "roleId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO sems;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: sems
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO sems;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sems
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _PermissionToRole; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public."_PermissionToRole" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


ALTER TABLE public."_PermissionToRole" OWNER TO sems;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: sems
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO sems;

--
-- Name: ActivityLog id; Type: DEFAULT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."ActivityLog" ALTER COLUMN id SET DEFAULT nextval('public."ActivityLog_id_seq"'::regclass);


--
-- Name: ApiKey id; Type: DEFAULT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."ApiKey" ALTER COLUMN id SET DEFAULT nextval('public."ApiKey_id_seq"'::regclass);


--
-- Name: DispenseRecord id; Type: DEFAULT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."DispenseRecord" ALTER COLUMN id SET DEFAULT nextval('public."DispenseRecord_id_seq"'::regclass);


--
-- Name: Permission id; Type: DEFAULT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."Permission" ALTER COLUMN id SET DEFAULT nextval('public."Permission_id_seq"'::regclass);


--
-- Name: Printer id; Type: DEFAULT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."Printer" ALTER COLUMN id SET DEFAULT nextval('public."Printer_id_seq"'::regclass);


--
-- Name: PrinterSettings id; Type: DEFAULT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."PrinterSettings" ALTER COLUMN id SET DEFAULT nextval('public."PrinterSettings_id_seq"'::regclass);


--
-- Name: Role id; Type: DEFAULT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."Role" ALTER COLUMN id SET DEFAULT nextval('public."Role_id_seq"'::regclass);


--
-- Name: SystemSettings id; Type: DEFAULT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."SystemSettings" ALTER COLUMN id SET DEFAULT nextval('public."SystemSettings_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: ActivityLog; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."ActivityLog" (id, "userId", action, resource, "resourceId", changes, "ipAddress", "userAgent", status, "errorMsg", "createdAt") FROM stdin;
1	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-06 11:48:54.841
2	1	CREATE_DISPENSE	dispense	1	{"externalId":"dispense-1767700297259-8ux1nkh3j","drugName":"Amoxicillin"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-06 11:52:13.729
3	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 14:04:59.491
4	1	CREATE_DISPENSE	dispense	2	{"externalId":"dispense-1767881543881-q9ufm5iyf","drugName":"Amoxicillin"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 14:15:03.572
5	1	CREATE_DISPENSE	dispense	3	{"externalId":"dispense-1767881680174-1jks38l2n","drugName":"Artemether 80.5"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 14:15:03.814
6	1	CREATE_DISPENSE	dispense	4	{"externalId":"dispense-1767882402712-uw9suse2s","drugName":"Amoxicillin"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 14:31:23.064
7	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 14:51:44.644
8	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 14:54:29.786
9	1	UPDATE_SYSTEM_SETTINGS	system-settings	\N	{"facilityName":"Flash Code Pharmacy","facilityLogo":"","address":"GB7, Gbogbo Street, Awudome","phone":"","email":"","licenseNumber":"","autoSyncEnabled":true,"autoSyncInterval":5,"offlineMode":true,"dataRetention":90,"auditLogging":true}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 14:58:39.844
10	1	CREATE_DISPENSE	dispense	5	{"externalId":"dispense-1767885742953-xmzgganqs","drugName":"Lisinopril"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 15:26:45.692
11	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 15:28:14.435
12	1	CREATE_DISPENSE	dispense	6	{"externalId":"dispense-1767886957121-zp6rfdtty","drugName":"Lisinopril"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 15:43:15.575
13	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 16:01:36.154
14	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 17:13:47.56
15	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 17:51:38.263
16	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 18:34:30.131
17	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 19:17:26.129
18	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 19:49:12.131
19	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 22:34:50.336
20	1	CREATE_DISPENSE	dispense	7	{"externalId":"dispense-1767912136680-samuth7ti","drugName":"Paracetamol"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 22:42:22.77
21	1	CREATE_DISPENSE	dispense	8	{"externalId":"dispense-1767912377487-wwc9hn78u","drugName":"Amoxicillin"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 22:46:23.829
22	1	CREATE_DISPENSE	dispense	9	{"externalId":"dispense-1767912664793-f6sjebv42","drugName":"Metformin"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 22:51:26.944
23	1	CREATE_DISPENSE	dispense	10	{"externalId":"dispense-1767912934774-624l6enry","drugName":"Metformin"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 22:56:00.857
24	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 23:07:39.137
25	1	CREATE_DISPENSE	dispense	11	{"externalId":"dispense-1767914389348-klrmiu263","drugName":"Ibuprofen"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 23:20:11.522
26	1	CREATE_DISPENSE	dispense	12	{"externalId":"dispense-1767914600471-j10mdv8t8","drugName":"Ibuprofen"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 23:23:43.67
27	1	CREATE_DISPENSE	dispense	13	{"externalId":"dispense-1767916163680-j9jzn0dpk","drugName":"Ibuprofen"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 23:49:31.367
28	1	CREATE_DISPENSE	dispense	14	{"externalId":"dispense-1767916432393-zskpspjfv","drugName":"Lisinopril"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-08 23:54:02.087
29	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-09 00:09:03.937
30	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-09 12:41:12.006
31	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-09 14:34:40.699
32	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-09 15:08:47.726
33	1	CREATE_DISPENSE	dispense	15	{"externalId":"dispense-1767970351310-9xskl6zaf","drugName":"Paracetamol"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-09 15:12:59.204
34	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-09 15:46:07.883
35	1	CREATE_DISPENSE	dispense	16	{"externalId":"dispense-1767973719062-2o1qs4mpw","drugName":"Amoxicillin"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-09 15:48:51.87
36	1	CREATE_DISPENSE	dispense	17	{"externalId":"dispense-1767973828271-3w8ic1cua","drugName":"Paracetamol"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-09 15:50:37.779
37	1	CREATE_DISPENSE	dispense	18	{"externalId":"dispense-1767974022502-zpyjd5zkf","drugName":"Amoxicillin"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-09 15:53:49.59
38	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-09 15:59:14.432
39	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-09 16:47:22.942
40	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-09 18:02:55.852
41	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-10 01:34:21.559
42	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-10 02:07:32.654
43	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-10 02:47:02.804
44	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-10 10:11:18.323
45	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-10 10:14:12.063
46	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-10 10:26:59.89
47	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-10 11:00:11.993
48	2	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-10 11:39:04.078
49	1	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-10 11:42:28.622
50	2	LOGIN	auth	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	success	\N	2026-01-10 12:19:26.581
\.


--
-- Data for Name: ApiKey; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."ApiKey" (id, "userId", key, name, "isActive", "lastUsed", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DispenseRecord; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."DispenseRecord" (id, "externalId", "userId", "patientName", "patientAge", "patientWeight", "drugId", "drugName", dose, "safetyAcks", "printedAt", "deviceId", "auditLog", "isActive", "createdAt", "updatedAt", "patientPhoneNumber") FROM stdin;
1	dispense-1767700297259-8ux1nkh3j	1	Mary Owusu	30	89	drug-001	Amoxicillin	{"drugId":"drug-001","drugName":"Amoxicillin","strength":"500 mg","doseMg":500,"frequency":"Every 8 hours","duration":"7 days","route":"oral","instructions":"Take with or without food","stgCitation":"STG STG 2017 - Ch.7","warnings":["Penicillin allergy"],"requiresPinConfirm":true}	[]	2026-01-06 11:51:37.259	device-1767700297260-pxz0qbg7w	\N	t	2026-01-06 11:52:13.694	2026-01-06 11:52:13.694	\N
2	dispense-1767881543881-q9ufm5iyf	1	Mary Owusu	30	89	drug-001	Amoxicillin	{"drugId":"drug-001","drugName":"Amoxicillin","strength":"500 mg","doseMg":500,"frequency":"Every 8 hours","duration":"7 days","route":"oral","instructions":"Take with or without food","stgCitation":"STG STG 2017 - Ch.7","warnings":["Penicillin allergy"],"requiresPinConfirm":true}	[]	2026-01-08 14:12:23.881	device-1767700297260-pxz0qbg7w	\N	t	2026-01-08 14:15:03.528	2026-01-08 14:15:03.528	\N
3	dispense-1767881680174-1jks38l2n	1	Mary Owusu	30	89	drug-003	Artemether 80.5	{"drugId":"drug-003","drugName":"Artemether 80.5","strength":"mg/mL","doseMg":160,"frequency":"Once daily","duration":"Until parasite clearance","route":"im","instructions":"Deep intramuscular injection","stgCitation":"STG STG 2017 - Ch.13","warnings":[],"requiresPinConfirm":false}	[]	2026-01-08 14:14:40.174	device-1767700297260-pxz0qbg7w	\N	t	2026-01-08 14:15:03.8	2026-01-08 14:15:03.8	\N
4	dispense-1767882402712-uw9suse2s	1	Henry Osei	30	89	drug-002	Amoxicillin	{"drugId":"drug-002","drugName":"Amoxicillin","strength":"250mg/500mg","doseMg":213.6,"frequency":"Once daily","duration":"Until parasite clearance","route":"oral","instructions":"Slow IV infusion over 2-3 minutes","stgCitation":"STG STG-2024-002","warnings":["Penicillin allergy","Mononucleosis","Severe renal impairment"],"requiresPinConfirm":true}	[]	2026-01-08 14:26:42.712	device-1767700297260-pxz0qbg7w	\N	t	2026-01-08 14:31:23.031	2026-01-08 14:31:23.031	\N
5	dispense-1767885742953-xmzgganqs	1	Sandra Kobina	49	70	drug-004	Lisinopril	{"drugId":"drug-004","drugName":"Lisinopril","strength":"2.5mg/5mg/10mg/40mg","doseMg":500,"frequency":"Twice to three times daily","duration":"Chronic","route":"oral","instructions":"Take with meals to reduce GI upset","stgCitation":"STG STG-2024-004","warnings":["Pregnancy","History of angioedema","Bilateral renal artery stenosis","Contraindicated in pregnancy (Category D)"],"requiresPinConfirm":true}	[]	2026-01-08 15:22:22.953	device-1767700297260-pxz0qbg7w	\N	t	2026-01-08 15:26:45.66	2026-01-08 15:26:45.66	\N
6	dispense-1767886957121-zp6rfdtty	1	Sandra Kobina	49	70	drug-004	Lisinopril	{"drugId":"drug-004","drugName":"Lisinopril","strength":"2.5mg/5mg/10mg/40mg","doseMg":500,"frequency":"Twice to three times daily","duration":"Chronic","route":"oral","instructions":"Take with meals to reduce GI upset","stgCitation":"STG STG-2024-004","warnings":["Pregnancy","History of angioedema","Bilateral renal artery stenosis","Contraindicated in pregnancy (Category D)"],"requiresPinConfirm":true}	[]	2026-01-08 15:42:37.121	device-1767700297260-pxz0qbg7w	\N	f	2026-01-08 15:43:15.554	2026-01-08 20:01:42.196	\N
7	dispense-1767912136680-samuth7ti	1	Bishop Osei	34	80	drug-001	Paracetamol	{"drugId":"drug-001","drugName":"Paracetamol","strength":"500mg","doseMg":1000,"frequency":"Every 4-6 hours","duration":"As needed","route":"oral","instructions":"Take with water after meals to reduce GI upset. Maximum 4 doses per day.","stgCitation":"STG STG-2024-001","warnings":["Severe hepatic impairment","Hypersensitivity to paracetamol"],"requiresPinConfirm":true}	[]	2026-01-08 22:42:16.68	device-1767700297260-pxz0qbg7w	\N	t	2026-01-08 22:42:22.742	2026-01-08 22:42:22.742	\N
8	dispense-1767912377487-wwc9hn78u	1	Vera Owusu	25	60	drug-002	Amoxicillin	{"drugId":"drug-002","drugName":"Amoxicillin","strength":"250mg/500mg","doseMg":144,"frequency":"Once daily","duration":"Until parasite clearance","route":"oral","instructions":"Slow IV infusion over 2-3 minutes","stgCitation":"STG STG-2024-002","warnings":["Penicillin allergy","Mononucleosis","Severe renal impairment"],"requiresPinConfirm":true}	[]	2026-01-08 22:46:17.488	device-1767700297260-pxz0qbg7w	\N	t	2026-01-08 22:46:23.8	2026-01-08 22:46:23.8	\N
9	dispense-1767912664793-f6sjebv42	1	Harry Atempor	40	73	drug-003	Metformin	{"drugId":"drug-003","drugName":"Metformin","strength":"500mg/850mg/1000mg","doseMg":160,"frequency":"Once daily","duration":"Until parasite clearance","route":"oral","instructions":"Deep intramuscular injection","stgCitation":"STG STG-2024-003","warnings":["Renal impairment (eGFR <30)","Acute illness","Hypersensitivity"],"requiresPinConfirm":true}	[]	2026-01-08 22:51:04.794	device-1767700297260-pxz0qbg7w	\N	t	2026-01-08 22:51:26.915	2026-01-08 22:51:26.915	\N
10	dispense-1767912934774-624l6enry	1	Harry Atempor	40	73	drug-003	Metformin	{"drugId":"drug-003","drugName":"Metformin","strength":"500mg/850mg/1000mg","doseMg":160,"frequency":"Once daily","duration":"Until parasite clearance","route":"oral","instructions":"Deep intramuscular injection","stgCitation":"STG STG-2024-003","warnings":["Renal impairment (eGFR <30)","Acute illness","Hypersensitivity"],"requiresPinConfirm":true}	[]	2026-01-08 22:55:34.774	device-1767700297260-pxz0qbg7w	\N	t	2026-01-08 22:56:00.832	2026-01-08 22:56:00.832	\N
11	dispense-1767914389348-klrmiu263	1	Unknown	15	30	drug-005	Ibuprofen	{"drugId":"drug-005","drugName":"Ibuprofen","strength":"200mg/400mg/600mg","doseMg":450,"frequency":"Every 4-6 hours","duration":"As needed","route":"oral","instructions":"Dosage based on weight, not to exceed 5 doses daily","stgCitation":"STG STG-2024-005","warnings":["Active GI ulcer","Severe renal disease","NSAID hypersensitivity"],"requiresPinConfirm":true}	[]	2026-01-08 23:19:49.836	device-1767700297260-pxz0qbg7w	\N	t	2026-01-08 23:20:11.485	2026-01-08 23:20:11.485	\N
12	dispense-1767914600471-j10mdv8t8	1	Unknown	50	55	drug-005	Ibuprofen	{"drugId":"drug-005","drugName":"Ibuprofen","strength":"200mg/400mg/600mg","doseMg":1000,"frequency":"Every 4-6 hours","duration":"As needed","route":"oral","instructions":"Do not exceed 4g daily","stgCitation":"STG STG-2024-005","warnings":["Active GI ulcer","Severe renal disease","NSAID hypersensitivity"],"requiresPinConfirm":true}	[]	2026-01-08 23:23:20.895	device-1767700297260-pxz0qbg7w	\N	t	2026-01-08 23:23:43.66	2026-01-08 23:23:43.66	\N
13	dispense-1767916163680-j9jzn0dpk	1	Michael Bonsu	50	55	drug-005	Ibuprofen	{"drugId":"drug-005","drugName":"Ibuprofen","strength":"200mg/400mg/600mg","doseMg":600,"frequency":"Every 4-6 hours","duration":"As needed","route":"oral","instructions":"Take with food or milk. Maximum 3200mg/day without medical supervision. Do not use long-term.","stgCitation":"STG STG-2024-005","warnings":["Active GI ulcer","Severe renal disease","NSAID hypersensitivity"],"requiresPinConfirm":true}	[]	2026-01-08 23:49:24.143	device-1767700297260-pxz0qbg7w	\N	t	2026-01-08 23:49:31.339	2026-01-08 23:49:31.339	\N
14	dispense-1767916432393-zskpspjfv	1	Michael Bonsu	7	25	drug-004	Lisinopril	{"drugId":"drug-004","drugName":"Lisinopril","strength":"2.5mg/5mg/10mg/40mg","doseMg":1.7500000000000002,"frequency":"Once daily","duration":"Long-term","route":"oral","instructions":"For hypertension in children. Start with lowest dose and titrate. Monitor BP.","stgCitation":"STG STG-2024-004","warnings":["Pregnancy","History of angioedema","Bilateral renal artery stenosis"],"requiresPinConfirm":true}	[]	2026-01-08 23:53:52.948	device-1767700297260-pxz0qbg7w	\N	f	2026-01-08 23:54:02.041	2026-01-09 00:11:35.083	\N
15	dispense-1767970351310-9xskl6zaf	1	Henry Osei	0	0	drug-001	Paracetamol	{"drugId":"drug-001","drugName":"Paracetamol","strength":"500mg","doseMg":470,"frequency":"TDS","duration":"4","route":"oral","instructions":"Take with water after meals to reduce GI upset. Maximum 4 doses per day.","stgCitation":"STG STG-2024-001","warnings":[],"requiresPinConfirm":false}	[]	2026-01-09 14:52:31.971	device-1767700297260-pxz0qbg7w	\N	t	2026-01-09 15:12:59.155	2026-01-09 15:12:59.155	\N
16	dispense-1767973719062-2o1qs4mpw	1	Mary Owusu	30	89	drug-002	Amoxicillin	{"drugId":"drug-002","drugName":"Amoxicillin","strength":"250mg/500mg","doseMg":500,"frequency":"Three times daily","duration":"7-14 days","route":"oral","instructions":"Take with food if GI upset occurs. Complete the full course even if feeling better.","stgCitation":"STG STG-2024-002","warnings":["Penicillin allergy","Mononucleosis","Severe renal impairment"],"requiresPinConfirm":true}	[]	2026-01-09 15:48:39.798	device-1767700297260-pxz0qbg7w	\N	f	2026-01-09 15:48:51.843	2026-01-09 15:51:07.914	\N
17	dispense-1767973828271-3w8ic1cua	1	Mary Owusu	30	89	drug-001	Paracetamol	{"drugId":"drug-001","drugName":"Paracetamol","strength":"500mg","doseMg":1000,"frequency":"Every 4-6 hours","duration":"As needed","route":"oral","instructions":"Take with water after meals to reduce GI upset. Maximum 4 doses per day.","stgCitation":"STG STG-2024-001","warnings":["Severe hepatic impairment","Hypersensitivity to paracetamol"],"requiresPinConfirm":true}	[]	2026-01-09 15:50:28.649	device-1767700297260-pxz0qbg7w	\N	f	2026-01-09 15:50:37.769	2026-01-09 15:52:39.195	\N
18	dispense-1767974022502-zpyjd5zkf	1	Sandra Kobina	49	70	drug-002	Amoxicillin	{"drugId":"drug-002","drugName":"Amoxicillin","strength":"250mg/500mg","doseMg":500,"frequency":"Three times daily","duration":"7-14 days","route":"oral","instructions":"Take with food if GI upset occurs. Complete the full course even if feeling better.","stgCitation":"STG STG-2024-002","warnings":["Penicillin allergy","Mononucleosis","Severe renal impairment"],"requiresPinConfirm":true}	[]	2026-01-09 15:53:42.989	device-1767700297260-pxz0qbg7w	\N	t	2026-01-09 15:53:49.572	2026-01-09 15:53:49.572	\N
\.


--
-- Data for Name: DoseRegimen; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."DoseRegimen" (id, "drugId", "ageMin", "ageMax", "weightMin", "weightMax", "ageGroup", "doseMg", frequency, duration, "maxDoseMgDay", route, instructions, "isActive", "createdAt", "updatedAt") FROM stdin;
regimen-001	drug-001	18	65	50	\N	adult	500-1000mg	Every 4-6 hours	As needed	4000mg	oral	Take with water after meals to reduce GI upset. Maximum 4 doses per day.	t	2026-01-06 11:46:42.366	2026-01-06 11:46:42.366
regimen-002	drug-001	12	18	30	\N	pediatric	250-500mg	Every 4-6 hours	As needed	2000mg	oral	Dosage based on weight: 15mg/kg per dose. Do not exceed 5 doses per day.	t	2026-01-06 11:46:42.374	2026-01-06 11:46:42.374
regimen-003	drug-002	18	65	50	\N	adult	250-500mg	Three times daily	7-14 days	3000mg	oral	Take with food if GI upset occurs. Complete the full course even if feeling better.	t	2026-01-06 11:46:42.38	2026-01-06 11:46:42.38
regimen-004	drug-002	6	12	20	\N	pediatric	125-250mg	Three times daily	7-10 days	750mg	oral	Dosage based on weight: 25mg/kg/day in divided doses. Take with or without food.	t	2026-01-06 11:46:42.385	2026-01-06 11:46:42.385
regimen-005	drug-003	18	65	50	\N	adult	500-850mg	Twice daily	Long-term	2550mg	oral	Take with meals. Monitor renal function every 6-12 months. Start low and titrate gradually.	t	2026-01-06 11:46:42.391	2026-01-06 11:46:42.391
regimen-006	drug-003	10	17	25	\N	pediatric	500-1000mg	Twice daily	Long-term	2000mg	oral	For type 2 diabetes in children. Start with 500mg daily and titrate. Take with meals.	t	2026-01-06 11:46:42.397	2026-01-06 11:46:42.397
regimen-007	drug-004	18	65	50	\N	adult	10-40mg	Once daily	Long-term	40mg	oral	Take at the same time daily. Monitor BP regularly. Report persistent dry cough.	t	2026-01-06 11:46:42.402	2026-01-06 11:46:42.402
regimen-008	drug-004	6	16	20	\N	pediatric	0.07mg/kg	Once daily	Long-term	5mg	oral	For hypertension in children. Start with lowest dose and titrate. Monitor BP.	t	2026-01-06 11:46:42.407	2026-01-06 11:46:42.407
regimen-009	drug-005	18	65	50	\N	adult	400-600mg	Every 4-6 hours	As needed	3200mg	oral	Take with food or milk. Maximum 3200mg/day without medical supervision. Do not use long-term.	t	2026-01-06 11:46:42.412	2026-01-06 11:46:42.412
regimen-010	drug-005	12	18	30	\N	pediatric	200-400mg	Every 4-6 hours	As needed	1200mg	oral	Dosage based on weight: 5-10mg/kg per dose. Take with food. Maximum 4 doses per day.	t	2026-01-06 11:46:42.415	2026-01-06 11:46:42.415
\.


--
-- Data for Name: Drug; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."Drug" (id, "genericName", "tradeName", strength, route, category, "stgReference", contraindications, "pregnancyCategory", warnings, "isActive", "createdAt", "updatedAt") FROM stdin;
drug-001	Paracetamol	{Acetaminophen,Tylenol,Panadol}	500mg	oral	Analgesic/Antipyretic	STG-2024-001	{"Severe hepatic impairment","Hypersensitivity to paracetamol"}	A	{"Do not exceed 4g/day","Risk of hepatotoxicity with overdose","Use with caution in patients with liver disease"}	t	2026-01-06 11:46:42.297	2026-01-06 11:46:42.297
drug-002	Amoxicillin	{Amoxil,Polymox,Moxatag}	250mg/500mg	oral	Antibiotic - Penicillin	STG-2024-002	{"Penicillin allergy",Mononucleosis,"Severe renal impairment"}	B	{"Risk of allergic reactions","Take with food if GI upset occurs","Complete full course of therapy"}	t	2026-01-06 11:46:42.309	2026-01-06 11:46:42.309
drug-003	Metformin	{Glucophage,Fortamet,Glumetza}	500mg/850mg/1000mg	oral	Antidiabetic	STG-2024-003	{"Renal impairment (eGFR <30)","Acute illness",Hypersensitivity}	B	{"Risk of lactic acidosis","Monitor renal function regularly","Hold before radiographic contrast procedures"}	t	2026-01-06 11:46:42.318	2026-01-06 11:46:42.318
drug-005	Ibuprofen	{Advil,Motrin,Brufen}	200mg/400mg/600mg	oral	NSAID - Analgesic	STG-2024-005	{"Active GI ulcer","Severe renal disease","NSAID hypersensitivity"}	D	{"GI bleeding risk especially in elderly","Cardiovascular risk with prolonged use","Take with food","Do not exceed 3200mg/day without medical supervision"}	t	2026-01-06 11:46:42.331	2026-01-06 11:46:42.331
drug-006	Azithromycin	{Zithromax,Zmax}	250mg/500mg	oral	Antibiotic - Macrolide	STG-2024-006	{"Macrolide hypersensitivity","QT prolongation history"}	B	{"May cause QT prolongation","Complete full course","Take on empty stomach or with food"}	t	2026-01-06 11:46:42.337	2026-01-06 11:46:42.337
drug-007	Omeprazole	{Prilosec,Losec}	20mg/40mg	oral	Proton Pump Inhibitor	STG-2024-007	{"Hypersensitivity to omeprazole"}	C	{"Long-term use may reduce B12 absorption","May interact with clopidogrel","Take before meals"}	t	2026-01-06 11:46:42.343	2026-01-06 11:46:42.343
drug-008	Atorvastatin	{Lipitor,Sortis}	10mg/20mg/40mg/80mg	oral	Statin - Lipid-lowering	STG-2024-008	{"Active liver disease",Pregnancy,Lactation}	X	{"Monitor liver function","May cause muscle pain/myopathy","Take with or without food"}	t	2026-01-06 11:46:42.347	2026-01-06 11:46:42.347
drug-009	Amlodipine	{Norvasc,Amlodipin}	2.5mg/5mg/10mg	oral	Calcium Channel Blocker	STG-2024-009	{Hypersensitivity,"Cardiogenic shock"}	C	{"May cause ankle edema","Monitor BP regularly","May cause flushing and headache"}	t	2026-01-06 11:46:42.352	2026-01-06 11:46:42.352
drug-010	Ciprofloxacin	{Cipro,Ciproxin}	250mg/500mg/750mg	oral	Antibiotic - Fluoroquinolone	STG-2024-010	{"Tendon disorders","QT prolongation",Hypersensitivity}	C	{"Risk of tendinopathy","May cause photosensitivity","Avoid in pregnancy and nursing"}	t	2026-01-06 11:46:42.357	2026-01-06 11:46:42.357
drug-004	Lisinopril	{Prinivil}	2.5mg/5mg/10mg/40mg	oral	ACE Inhibitor	STG-2024-004	{Pregnancy,"History of angioedema","Bilateral renal artery stenosis"}	D	{"Monitor BP regularly","Risk of hyperkalemia","Persistent dry cough may occur","Do not use in pregnancy"}	t	2026-01-06 11:46:42.324	2026-01-08 17:47:11.931
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."Permission" (id, name, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PrintTemplate; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."PrintTemplate" (id, name, description, "htmlTemplate", "escposTemplate", "isDefault", "isActive", "createdAt", "updatedAt") FROM stdin;
template-001	Standard Label	Standard dispensing label template	<div style="width: 80mm; font-family: monospace; padding: 5mm;">\n          <h3>DISPENSE LABEL</h3>\n          <p><strong>Drug:</strong> {{drugName}}</p>\n          <p><strong>Strength:</strong> {{strength}}</p>\n          <p><strong>Dose:</strong> {{dose}}</p>\n          <p><strong>Frequency:</strong> {{frequency}}</p>\n          <p><strong>Duration:</strong> {{duration}}</p>\n          <p><strong>Route:</strong> {{route}}</p>\n          <hr />\n          <p><strong>Instructions:</strong></p>\n          <p>{{instructions}}</p>\n          <hr />\n          <p style="font-size: 0.8em;"><strong>Pharmacist:</strong> {{pharmacistName}}</p>\n          <p style="font-size: 0.8em;"><strong>Date:</strong> {{date}} {{time}}</p>\n        </div>	|cF|\n|bC|DISPENSE LABEL|N|\n|N|\nDrug: {{drugName}}\nStrength: {{strength}}\nDose: {{dose}}\nFrequency: {{frequency}}\nDuration: {{duration}}\n______________________\nPharm: {{pharmacistName}}\nDate: {{date}}	t	t	2026-01-06 11:46:42.421	2026-01-06 11:46:42.421
template-002	Detailed Label	Detailed dispensing label with warnings	<div style="width: 80mm; font-family: monospace; padding: 5mm; font-size: 10px;">\n          <h3>MEDICATION DISPENSE</h3>\n          <p><strong>Patient:</strong> {{patientName}} (Age: {{patientAge}}, Wt: {{patientWeight}}kg)</p>\n          <hr />\n          <p><strong>Drug:</strong> {{drugName}} {{strength}}</p>\n          <p><strong>Dosage:</strong> {{dose}}</p>\n          <p><strong>Frequency:</strong> {{frequency}}</p>\n          <p><strong>Duration:</strong> {{duration}}</p>\n          <p><strong>Route:</strong> {{route}}</p>\n          <hr />\n          <p><strong>Instructions:</strong></p>\n          <p>{{instructions}}</p>\n          <hr />\n          <p style="color: red;"><strong>ΓÜá Warnings:</strong></p>\n          <p>{{warnings}}</p>\n          <hr />\n          <p style="font-size: 8px;"><strong>Pharmacist:</strong> {{pharmacistName}}</p>\n          <p style="font-size: 8px;"><strong>Date:</strong> {{date}} {{time}}</p>\n        </div>	\N	f	t	2026-01-06 11:46:42.43	2026-01-06 11:46:42.43
template-003	Minimal Label	Minimal label for quick printing	<div style="width: 58mm; font-family: monospace; padding: 3mm; font-size: 9px;">\n          <p><strong>{{drugName}}</strong></p>\n          <p>{{dose}} - {{frequency}}</p>\n          <p style="font-size: 7px;">{{date}}</p>\n        </div>	{{drugName}}\n{{dose}} - {{frequency}}\n{{date}}	f	t	2026-01-06 11:46:42.435	2026-01-06 11:46:42.435
\.


--
-- Data for Name: Printer; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."Printer" (id, name, location, "ipAddress", "modelNumber", "serialNumber", "isDefault", "isActive", "lastSync", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PrinterSettings; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."PrinterSettings" (id, "printerId", "paperSize", orientation, "colorMode", quality, copies, "autoSync", "syncInterval", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."Role" (id, name, description, "createdAt", "updatedAt") FROM stdin;
1	admin	Administrator - Full system access	2026-01-06 11:46:41.64	2026-01-06 11:46:41.64
2	pharmacist	Pharmacist - Can create and manage dispense records	2026-01-06 11:46:41.939	2026-01-06 11:46:41.939
3	viewer	Viewer - Read-only access to records	2026-01-06 11:46:41.957	2026-01-06 11:46:41.957
\.


--
-- Data for Name: SMTPSettings; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."SMTPSettings" (id, host, port, secure, username, password, "fromEmail", "fromName", "adminEmail", "replyToEmail", enabled, "testStatus", "lastTestedAt", "createdAt", "updatedAt") FROM stdin;
cmk7nct8e0000s4qm476u6yls	smtp.office365.com	587	f	michael@rhema-systems.com.gh	LnkcpMI1kSa9tvbOgb4G5biRB4zd2uRNvql+xSBW4WjLj6oevHclJCvyIk//l3wD	michael@rhema-systems.com.gh	SEMS Support	michael@rhema-systems.com.gh		t	success	2026-01-10 02:27:38.316	2026-01-10 01:49:08.988	2026-01-10 02:27:38.319
\.


--
-- Data for Name: SystemSettings; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."SystemSettings" (id, "facilityName", "facilityLogo", address, "phoneNumber", email, "autoSyncEnabled", "syncInterval", "dataRetention", "dataRetentionUnit", "auditLogging", "createdAt", "updatedAt") FROM stdin;
1	Flash Code Pharmacy		GB7, Gbogbo Street, Awudome	\N		t	300	90	days	t	2026-01-08 14:58:39.809	2026-01-08 14:58:39.809
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."Ticket" (id, "ticketNumber", "userId", title, description, category, priority, status, attachments, "createdAt", "updatedAt", "resolvedAt", "closedAt") FROM stdin;
cmk7p280s0000d8qmkpwwxitf	TKT-1768012614142-9W85AXCAT	2	Cant search for a patient	When I try searching for a patient, nothing shows up	technical	high	open	["81hmQZtVc2L._AC_SL1500_.jpg"]	2026-01-10 02:36:54.159	2026-01-10 02:36:54.159	\N	\N
cmk7phlu70002d8qmnrhcmixi	TKT-1768013331913-FPYKLWLSM	2	Dose calculation is wrong	The way the dose is calculated is not consistent	general	critical	open	["1541443106-20-nas-facility-management.jpg"]	2026-01-10 02:48:51.916	2026-01-10 02:48:51.916	\N	\N
cmk7pppxi0004d8qm3akjvrmc	TKT-1768013710448-S9NTI2ZBD	2	Cant login with my email	Unable to login with my new account	general	medium	open	[{"name":"interior.jpg","data":"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","type":"image/jpeg","size":49486}]	2026-01-10 02:55:10.467	2026-01-10 02:55:10.467	\N	\N
cmk85je6o0000hgqmu28yx89d	TKT-1768040289116-O6O7CXNUE	2	Dashboard data not refreshing	When you reload the page the data on the dashboard page is still the same	general	medium	open	[]	2026-01-10 10:18:09.144	2026-01-10 10:18:09.144	\N	\N
cmk87l4pc000698qmyf4asbks	TKT-1768043729407-4IX1QZIRV	2	Not receiving email alerts	I don't receive emails when tickets are updated	urgent	high	open	[]	2026-01-10 11:15:29.418	2026-01-10 11:15:29.418	\N	\N
cmk86vlko000298qm4x300cfo	TKT-1768042538180-CCGZO27MT	2	Application is too slow	The system takes too long to login and process transactions	technical	high	resolved	[{"name":"livingroom.jpg","data":"/9j/4AAQSkZJRgABAQAAAQABAAD/7QCEUGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAGgcAigAYkZCTUQwYTAwMGE3MDAxMDAwMGY1MTQwMDAwYzAzMjAwMDBmZjM1MDAwMGRlMzkwMDAwZmM1MjAwMDBlNDgyMDAwMDVkODcwMDAwYTg4YzAwMDA0OTkyMDAwMDQwZTkwMDAwAP/bAEMABgQFBgUEBgYFBgcHBggKEAoKCQkKFA4PDBAXFBgYFxQWFhodJR8aGyMcFhYgLCAjJicpKikZHy0wLSgwJSgpKP/bAEMBBwcHCggKEwoKEygaFhooKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/CABEIAlgCWAMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAACAwABBAUGB//EABoBAQEBAQEBAQAAAAAAAAAAAAABAgMEBQb/2gAMAwEAAhADEAAAAfWi0caULahQtFV0dAUdQEKgYVAwoowqKlyKuQkkJI1VXKQpUorGwrGy7Gy7GIVhYcplLDVgRhLuVkXA6ChkXA4EDgQKqouVRdSluqhJUJUoklF1KLgwKDDtUM1mxugaIYGipQhUCJQGiqKkhUuFS4tS4VV0QgqX0GJXb8mvLz0PJ7TLYX1yyDdFBsuxgUGgulyqPVedzSw4FSnF0h0FDIuDIuxlhalKOUJUsklElQlSEqSJJVSpCSoSSHWqq1koMCqpEkpaq4DLgIthltWeOhAMkkJJCCQrQlSV2+G/nv02e78e8HO6+bteZerN35SBNw4MCoaDoaDGqLgwuqouC2Rc6e7m89q9CWd8jVOTbuwLvpm6lJdSEqQlSEkhVSVJKJJRJJXSlTWblVBQYFKhcqLJIU1cOnzRgumSAhQGXCquA0VA0dLu38TXw66EqFDCh1BU6ameMDUqVElSEo2rnvbrxrDv06eNmxIc8OzI5XTXS4+Kd4RgWsldXEkokkJV0SSiSoSSi6lF1KqSpXSlXcySypcKuQkkWSWVLhUu4GXAaOAUcAooDRSUIcFskllHXHoMObyMOUFMpEVolKM5FQrlo7PNjxFdOLBm3g13NZG5KKxKDlWSSEsYMzdgtTgMspaupF1ISVCVKqSpXTuFc1d2DZWDR2LjILjIoHUlYaJm6ry3jWqZ7yeSLxvS3DMzpt5BZz1h50jTlqr1UGu+mcV7S1OfXTicyuilcUesG4wt16caFrnY5+c5ntg6Y8TPWZda85O1n05d61aiiq9CkuypJEqxJV0SpCVISpRdVQVVVXBldY8Om50GLgbaVJj4Ij4Ij6hEfQinUKjKAhxQhyApkFRgyjRVFai6fn0s7HhTJFRomULNgYNcoo3RrmD0VXWZ1haJcaenj2a48OtOQK9muNF7RcOR3h4l11Vc8bnWhQ6Wkx1KqUkqCXVUXVVV1VBCNUUCGg2gjdnLh6HR5vWdwufs1GXZoqnRUU+jHze0ozNfUIp1CocAhxV02slahd5eprZXLQxSe01BiDrnSldayJhUvQ2cRvDfdLl6vM0VbJjyNbMv0sjDlLplC4coJecfBKJKolQS6oauhoIRoIaouqGioaLGqS4EruhssxBsUZB1jCNC1R19/mGV6xnmuhZ1pmbYY3YAsFViwRYsGBlwFoTOmANSgLKuVi0aXTJKoWJLpkhVNGgeqs66LuOzhqZnL7YqrnSVViVJRtwwUg2KyqWGKoMFaTSOUE2VhE3DilahSKNCwIuxq5UPXV1BucDaCViqOXOG4Vwr2qjJNArezminotHmNB6KcV1nTHDZsDNY+IhotFjqVBkXIOggUGhueDRRIRoHMNuiswJrrIC7Rwmmla1DQl0upAYwBdlJUg+zPb1AA2gbuImnUCJSlC2gKZYloUKjIe+u71lRWQrNuhyR6wxzD05VFTKlzi8ZUr1LjPZIrSfHpO6XCfXYvmEnRvJdaqQY4QIurgJWMDRxaBtCiIhVGJa2jEU2xNaVC6ZFANaQFvETG2IrSgWV2RDhAHQsgXQptWiYyqqVYkdSRcfD293dizorBlwEWDZQnBCtFS8et2eFi0cbzJ1Js5wNGjaDQmMlllGgHCF2UJGBEYs1GrIW0RKuFAVcDCGqoTRIMotR2KrSkEDgujsCSC2rgImYiGIVVBVNJE0yqEGrBBwiY2Htyq7AKjQZcsoTFQuQFblWZ1NGXMDA57StoVz6IUJ4tq2RlkkeJIhKuzAYFy2S7Ll0Q1kDVshRESptxGatdxjPTS4x3WYB6LE5q91nPvfS4SccZ2eDXNe9H5+Ob79Hg/oNghkvWdPY5PLr0ofNS59Po4/Orl+iB8+qX3E8PJfst0Xq8gGDFGXSSrlgUQrFnLMQ2MqBIee1AwKxJaCG+ipjAbZVlZRjQVUQLQqWzXZcIQ4uDMmrFm5i58zro7eD6CzzoN52b7Xhek8+q7BwHe43eueErajQJolmfr4ehm/KmPfbi6d9/Gup1KnXnwufu5HLXX52jlbnM2N5uNdGO6GO/JpW+8skdMa+l3V+vzCYGVJCSRKBgUFEBkVpAx1dc+iwMLMayFGtFtjCuqIhIkqhiyqWMEC2KMlhBtBUrszVxx7jM0O9w+7XneX0+Vh9B896PhNL0dx3Lfl+3g39cctOnB1xrijL3YN2L8z6XO5E36vvfP8A22s+n127WPK+d9F5rn06XP1ZevKuT2eLy6eg24s/L6Cte/mzx1ETWvq11fq8omBkkhUkJV0AtykzCQrjEg57EFpsobdYp+h9ZL9Iceav0kl88fbBeTXTXGBjxlRWjyMvo6+cadPfX4tqewRxuynJaJ4od/znpa8/y+rgs9xwvQ+bxvoPS7h0ya8HU68+N5b3WP0c+T09WiOZp0qzr5rwPW8xcnquV6DWfczh9dPNeV9j43G96Wt688PB9dzeXTTw/Vcvj7+95/0eXfi81OrMb+mXRezygxbC6uINXSySi1nSYQapcq2L5bxea7/jd57S+t5o9B2eP6GX0JAfPdAVIsGLUFsXKFWOU8D77590wnpc/q8fXkCJz07m7js9XhYPm81z7V3l9EvrncZeNah+bKzr6SvwFanvOl869Xz2hPnEanpg4LLPb+d7Xl8b73J9B5vU9T4P6P0+nL5Af1jn6nP43pfM41u3Y9Wp5YdmrN49dmLxq7QxxZ15nf166v0+YGLYkurWquINXS1ViIAwMKmr5dOdwvR+e1O/5P0Wa5X6HyvqpfTkJ89hV0LAwlBbFyBUGWfP/f8Az3phfR5+3h7cOK1bxu9V5P23XzeZyac+8drPs5WdeoylOe/nYNdb7Tn5eZ05V6bgdrj18mYaNCOiT0QF2M64nI9T5mvTb823pyAbZXG8z6XzWNa92L0ep45HV4Gs+h2clpyvQ+M9aDFTj2+qWJejzCxTVkkLqWDR0gAwFzgQxiWY8unMR1MheXKvWfR6fOPPSTzxS96uI+unXMqOlXPuXdWNkumZGD7y3LppBwzn6s1nkeb0eX25+uwbFZ13Bk5b8h3OD6Hj0peg8OEOrL6Mdo+S3tz6nNyos6Xe4h8e3f8AC+m84er6XO6XTmhlGcLznqPO5rvUea9HrPi+d0fO7z3NfP7tYY7HNZ4qcen2ohv0ecWLNbuoXdQl1CDYorO5cuAGL5dFo0KjmpcvWWOs9LeBJRldomQxTBkow3y5rNkLhXKu3RUaFgggQDxzga8+RUOVyfN7x7YPIN6ef1AcC9c+6HFWnarzyZ09LPKbOffvFxWZ69SuaZvrA00IF9mrvcLonmPP+mGzmdWoRGgmuLOrOevrNiXo4CxZlyrJKhdjIsbEQDAMK2Bx6LU5Rz1sXqNdTNQ2jdkKGoFcgrlSlVvlQcbKEsoXT6lzxwCwaqhzaLTnq0p1OHxu9xPT83b0svd9v52tPTdvhxsnc5+/PwOf2eVy+hzce5Hh/QPbHef6S2NgmaYZ2Pg+2pXzBM0ZuSbKMg7YuCb5nX1wqv0ecWLYSSyquEqQqiozLaMuJbF8dgtijCsl6jXiWo6xKiuWQ6qDJMl00l0psytzptpuH0IwdLAYqk6jchVqZwaFnG5HW4vp+b3PQeY7vt/Oerzq18ffWbTzdc+RyOjyuni5uLUnxfpNzQf5/plBYDd2gspw7NqwL548trsmSJprNF6U5Exfu18uunPpt4hHanFqO0HIE7E4oy9oOMEdYeVcusJWaCWZlzC1udKc5tiWsOxE1WZJrozTTRlXuKXnTt7pfMB7Epz8Xl95ht8aezgdXaHk5zus8NuPSj5bQmzg+h5PTz6epwr9Py/V6PGhrl7TH5sU6vOSGe2del3n+mZvfx9efRYIJ4G6j2YyOpz9+I8s5V1YlCrgmaFD69eiYqbdcJt0E0+RnrRIzVpozR4wKjSo5W5Ftqehz083MZzK6Cly6GY9V4PxAjnwS92KKmaiDpz2aeJJOxl5Q53OD2E9ced2dB2b4Dr93s14xPtMWp57V1bzrmB0hs5qOrisTaOpZkZqz893n0vzcriLOh4PoLrzN+uDpjy1+q5srtGdZzD5LK6VYCNtZKl0TDI+syXrnVyLJJEkqSSVLQkEUslgIZnFZOhogtljrkJIRqaz5as3rqwHw6vVlz40lvJ6nTfWJDdOik1+jitgulVyev43U7Z+WVXrX/PmJ9DZ8/kvuc6HIpbFLBgJAIAOzxM6+/r5voj31eLWe3rwonu68JVe7Hw1nt68ZsPQ+Z9d5DOvOH3kZ1y2c7p7xc1hnpkmuYv0ixvpyuVIupUShpDi8mLtDGyVgHWVbMI5nXLhZ8PRhw7OxXIs6HMYzU4q+xz9A5+nRnryuoO5o9K3rp6WLdh5j2ngfbdOPK8V7Lx3rziToTZz2U+hbDl9KxLpFLNVo1Ksg2MKzvSvL9DwPQ4126seW5KhJLAFtWJ5/W5u893yPrfJWjl6HNxeH0MGv0+f0/L7/n+Pe4Mxr6La63htDIIKKXFm79GHaD0bmy6WmUS0ZdsTnp6KpeWvrLOUe1WcuXiRnPVTl28tC/Kub6mnk3z1kSue3D/QeX18+nlfpnhvYS5fJeq8t6uGNTQ3nEwHBaBM7Ls+CXSnotl49du44betlrmAJ2Y+9xPQnQHfJefXRuOdOjK5ldSRyud6Xi2dPyPrfNZ3nybs+L5otVd+PQLI3n1bDmNeyfzmpo6fIvWe0vE+nczUGdL6vOTHUZg07zoTQw1KMmd9VKhsvBqXm6kYm1nfXMuRN3PvHrTk9PzdXUtWN5fE+00eqcjrXm6Y29HipT03mu1xtMS3JrMQMRz0tOhlvbLrLnrl605El6qMFJzNgjqL9D53p16i+UWXTvmmdCYSrZWSzVxulyrOp5X1Xlcb5L85c+mgssXZeOk1TBJr1KmL1yezlbLXXgcaSyPTYOR0upOc01FkTXUHEqOmvDpXSjMaDrSAYCoUzA6zB18mOcuyMXw9HHeDum7p9yZyeR1OZ1uV6OOJTUWIPTorKW9py+f6Pzqea7Of19cG+4MvnMHseBYrtee9IJ6OHZz11CSXHo0lGpksgoNpOd0edvPc8r6ny23JKLzsq359ZUR3jWeOmdd0hLpywbMzpFVv5E1stWmqBwMi9LJcu7JqV/OmWu03m1Zpixk2Vk0LOY0oPE/lL2uV0eHvh3pjrzdUt0G7gdSxhK0WdTkdzld+PIw9aZ1x376zrO2xC4Ha4HTGj0PI0Z10S5Qx2uUpNnI9p4b0HTPXdw+lz30iAudYSzUyWQcGwud0OfvHa8v6jym3NFexevw77e8c5RZMa1QZy6Hq4mjWO6mLudeFOfPTqmpdzW7lbq0NyUzp813cLZdjBuZHFv4h2BaBj34dE0WWBGribOJTXcTVc6+vi7PLpocOzltGjoO78sGsA7c3EkrGCcIQELA0Gfwf0DnCl7xOYHSI5S+yMeG72vpr50vSvzfHD7IdTy+jrJlzacOM9CflcZ7jB5PoWe18x6PmTXBT7HRjXzzZ7gNY+dt99ed+Kns5jXx0u4v0cOS3YsFiQXczlBHdd5yHoZ5+R6dnltk174s9yM4+/mr1mc7Uq8/MSnTrP2Ma5N9+8b4+vobY527qaevPOVK7c2AEsZeQjUeIh9rYWUsIRUCUXTgW8GotGJ0kuGbxOc+6INnCweYk4QN3CFUB4Pd4HHpnFw8O6zg2NZjCzpTnSrHdGeYHXo5A9ijih3Krgr767PPK9GuzzY+lRZl3Ysy9XAm63xOrNzdFruey0L3Rn09KduRszJ7c9Q59FkQ5RCzuJQiMJNhlniuvKs3DiI3TFSb5zNI2VKISuHkiGlKUGt3HI6lZdCuoyEi1ZZKorh6s/m7CLR49VSSyUVFSQqar3jMTqFi21QOuJlNshdHS1dwlWVIrScZS0VAaM+vtjdowF25alLCx1qKgshJa6BJgwUxOGK0AJoHgwkgR1lVAFWsTeGVZtvEo6g8xxoTShsYobswOOmzmmbQEqKoEZMaHeT0wbrGhuUFYUjIMojWe8sILGRVU2AZIVoFMguzqUIUgbuEupKObZEx3srU5hdKzBNtaZ9ebNrPXdwR1O0vmDZ1F8xOp3Zzz1OiGQk0KFJsPnEG3OY/CFj7AhwKxm9ObaBCSaN2PSOOPEA6zOw85oPnZZWzNfi9LaVZBKyCcpUKQ+yveBsroLKiFRUVgSQWEJp8XMOuoyzQELK6mpdMiisgLOgaOQNFahDgLBqIDIKTrCsI7q1nmL68s5Cu6Opw9PQRqKTK1A05qs0iK9Z0pyDZ2RwVXR6XD0HcPH0ExNdZmY7Ip8zXyue9Aqvzd7qhghGixKUMdDSS73h1KuxlQ6q6tCuHVCcAZBg1jUtjclCiqWyjYTWi4QTKAuxUrCobQWsKrJVyAEhKq6KsaDC7pI6KM9aAFWYy1V0gw7rIjo1qY1dCWZydNTFocNmjdxq1np8yOxsRZOe006QmGNQCAqXDccnTmZyWQpApJRXJUORIMkoBJKNSZo1JmypFK5ApJF3IXchYSFXJLRSEVJYFSRRSLJJQ1JF3JUkiVckSSVUkQKkUZIo1IVJC5IDUhKkKdIVUiVJK//8QANRAAAgEEAAQEBQQCAgIDAQAAAAECAwQREgUQEyEUICIxFTAyMzQGIzVBJEBCUCVDFkRFNv/aAAgBAQABBQIwY/6nJn/uIx2Gmn86PccUS+vnnln/ALOEtZR1qRq2rQ+3zMlp0sPpYr6dX/ubeZF5VSnGZUoSj/uatf77NhP5fsUKgxlSCkSg1/rQpVJEbVit6cSdaMRtyf8AvYyVYsp7ZUvl0paypSzFkhkopji1/oQpzmQsqjIWUERhCmZKtxGBUqSqP/oKc3CSuVirrKWpj5dGY5jkNmeTQ18pJsjb1JELNFO3px5N4HLJUqxpqrcSn/2UXh5MmfLjzasUBQiiLIsUhSHUJSSKtyPv/wBpFjM+dxNTVGPKmRzyqXCiTk5v5evaeUKTZ3/6XBqzDMGDBgx5MeXBg1FEnUjAqVZT+dQdBxrO01X+x6TETWJrE1iaxNYmsTETsJLyMkyRgwYMGDBgx5MCRGAqZ0+1XrDTX/W5ZszY3NjPLZnUkdaR1jqITTNTU0NDpnTOmOA4mDAiIhc2Sp02St6THaQHaMdvUQ6c1/s45YMGDBgwYMGP9C3WXqamPK0OA4GpgRnC654hniGdZnVZ1Gbmxkydh06ch29IdrEdrIdCaHCS+epkZCEYMGDBgwYMGDBgwYMfLpUdhYRk2NjY2OoKv6ozTM8nE1ME/o6jOozqs6sjqyOrM6szqzOrM6szqzOpM6kzeZvI2kZf+gmRm0QqkZpi54MGDBgwVPSpV5Ig3JY+TghFIczY782x1EOoPu4sjVZGaZnlqakliX+9g1MMyKRGs0QrJikZ54McpRyOmmYx8nAoyNDVIckh1R1GNt+bIpEZkZilyuliv555iKoZ/wBVprlgwOJ3NiNRohcEaqYpGfnLsbjkx/MWUKoRnk2aVeW8vP1qeJY2+bsjdHUR1EdQczdmzxlDimOA48sDiamWhTIVmiFdCqCf+ngwPsdSB286qNE57P5eUOSR1IjkbDqMc2bSMvlgwY7YFhDS8mJIzghLJkcUxwGuTQ4mGjYjUaIXBGsmbmxkyZMmTJn5eYtOEFL5OUbIdRDqHUOozeRtI9THltQHFrzJdsRGu4o5HHAl5EiXseljpZJUjWSM4FIyOKY4DXLA4ndCYpsVU6hubmxsZMmTJkyZ8zaN4nUidVHVOozeRtIex3MeTVscMGDBryaxzjEkkvL3Iru/fyyXq55izQWyeYsdNMnSNGjujY9jCHEa5YMYNmKZubm5sbG6OrE6qOqdU6jN5DlLOzP7Gamj568kdzA4YXlx6UN+RrvyWD08sDQsDfY07YGhMb54y/SzQW0XsmapmJxMo1iyVE0cTubInNRjFqSGNEkTcomZGWREYFBmOWOS7GWJZGseTJ/S7NvnjtySMR5YMHZDFHJgccCJeTvyyPv8jA0uSeD0s0FtF7I1izWSNj0M1aG2YgyVErU9I01hGBoaKvuQjkx5F3Y3z/rlhD59uSjkSyex2w/LnyZ7c1EceXbD98ckstaoaT59sYHHy+lmgtk9j0M1ZmSMxZqetGYmqLhxhSt+j0RjGVvfBERhCMEcYYo5Md/Z5591yTH35554MLBlYfvySOw15GvNkfkQtcPAhvPLA00KLZ6WaC2T2PQzQ9aNkYizEkOR6GVHOnClPek+TGVfqyIis8kZF7+XsIbEsjWBe+Yj5pebYfflnl2Q8CO7OnM6NQ6FQ8NLHh5HRia0UOpZoToVKOEU1tUnQtqb/wAE3sEdexR4y0R8Roj4pEnxho9LNBbJ7M9DNEYmjY9DND1obiVFLSn1XS5sre8eUXg9zXmxdz+sdv75555fPUUZnSmKjI6LFSRKlCJpRMW5/jG1uhuiqCuKZ4k8VI8VMlczxxacoWXiK1RurPHWOsxVHKpxGhTza9LoRlmND7/6jnpeddnWZ1ZG8jaZ6xRk5+lmglJPZmYmsTWRmSMxNYsxNDkypHeFOMlT5sqe4iPlwZHz7H9yeeeEJi+u5uK1Or42qzxFQ68j7ljOconXLlbW7lKL6hublD1cPmhSZlnc7nFfwZJ7dPIqRY2SuLihwi1pxnPU/ukUPv8A6j73kKYqR0jpnTNDXv6WaCUs7SNomIM0PWjY9DNR7or9OVOnGEKXNlb3QmR7Hu8ETPdvPJ+8SXvzUh9+cPrvF62iH28Mt1/hVl6mlma/xZkYmpgt1/hVF3ijBgwcU/DziW0YtLvwtf5cW1Qq+39xZbv9/wDU9SUeIVn07e3uZSq3X7dbpRdpS9Fdofv6GaCUs7SRuj0M0RiaNpG0WYgzWRXko0qLpdB82VPfIhc0YYkIlz7CP6awdsJok8kX3ufrZH6Ch+JcfU/d/i1PelCUjozXKh+HV94+Tif4cvuPSBlI4Z+V/wCqv9Jn1Wj/AMn9T/yNf1WdpGPVvu9zw2W0q0OnKbwsnoZoJS2zNG5mDNYmrP3EbGYM1RN1IQjOU6T8lb3Rkjg7C7PJnyJZGuefLD67n62L7Rb/AIl2ntA/+rrtOjBRhP6a6xGh+HUTOpGJthvKTzjif4b+5KtUlXvpvHAJbmB92zOHafk/qf8AkLvtbWs1tdfk2lXTjFxSUrbO9HPb0M0QovPrRuzaJ6GaGJm00bI9DJxlrHqdJ+Sp75ERO/k1kKMhwmdOodGodCR0JE4pGIH7RmibW5GVDe5+sy3OHeNv+LX+7/y/+rH7ndPqSZdfat/waz/xFrra/aeSX08T/B/9tTCd6oyrfpqWWvof1Mf1Wf5P6n/kLjLs7b79f7lafS4hxX9unaT6lNPD9DNEKLz+4jeRuj0M1iaMxUQ5SHKJOCnCMWqb5OaivFUTxNrIjcWgrq3Kdek2oRMcssyzLHnngwcTx1pLBFHTcRQLaH71z9cPehc5EtKtr+LXxvKOHFf4rjUjUhKRrIq07mo7elUjaRtqjo/Cll2TUXbvDtziMXK1dndJvhF641OEXtWfBLC4tK1zQrTut/VVp6U2/XaflfqK1rV76rbVpULfh9zGVa1rOtdcNuKtdQquPh2q87PNXEDRCi84mjaZubRP2zVGsj9xDlIrdOVOChGmxmNlGvGpVuYyowpVIyjRxONFauPt8rirfxC+eFTUfh1X6aMsK2lmreXcKVX4nS1jxKkj4qmLipa3zrXF5xGNrP49SPj0B8fiPj6PjwuITlw+fHK6Pjdc+NXB8YuC7uqysnxO4KFW6rUZX1YrQq3NnOtc7dS6ZQ69a54dTnRspfXZ/lfqKvWpXfi7k8RXOrWN6pmofuCU3PEGaIUe+JnrRvI3RmBimaI1kPqIrTUadKUHRYyrNwjTX7/EI729NODsp06ao61pR9vlcW78Quz/APPqfTTKFSMK/FfvsjJOqqFTp0I4lwyObnjizUqrvGJQjUqup1KU9Cmv/CVkRgaHTLtf+Mo0XXueK4hDpke1CU3ClD9uTsKXWp/RL67P8j9R/lwp5FROkdI6Zoad9YGiFDvrI/cNpm7N0ZpmIGiHFknUhBSlOmxko7lHDsZR3t6MsVFHSdpHVx9vlcV/kr9lCTlY3E9YwqTKFRyuryj4i6uLZUKFCOLm3evC4yw7VRp3HGe7qe//AApUenb8YhrZQ9UKf8RV94R7KJqXn8dwCjtccVX+VgfajL7MUpco+0vqs/yv1D+a6saUPF1VWtairzqwUbJXcycYoaNYmiFDvpIxM/cNpm5ujNMxTNYkoz0W/TYyP1UP4+bnUt7ipCdGjUdWVtkj7eRj5MfLi38le+1PEbLialrBVIqzpVPFf/qcWlie0d+Hv/xyfaxTdXixNNyjCWtK+uKFO6lc8QljWKklwefdxaxvE3iXbzw3gEcWXGafaBH2itoQ+qSWqJfXZ/lX9CnW4hcdOkQ71OHv/Pq3EnQqInOKN8mImqIx76M1mYqH7htM3ZujaB+2SipRUdYPlXpRqQpW9vThDwlKSo8OzSq2MF4q1z4+iePpHjqZ46meNgeLgeLgeLieKieKR4pDuO/ijxTPFyPFzI3U5Sl/J8Zb3os4PHNkyzliXFfayliqqjx1WdTMuIyyl/8Az3DbalKjeUqNGVnRpKhxGnSUK/8AE8Gn/gX/AKraDIe0F6bfvVl9ol9dp+TdfyHEfybep+3YS14m3rw+1gqljXSVOD74gaRIx76GkjWZiZ+4ZmbSNxyiTVKcUoxg+UkNFxHvGBoiCRhCiaipjhg1NTAkNEew/ZRyOOBRyYRGOJz/AJLjbUSjSoVqfAasXa1l6rf8zin0cOa6y6eEqJGNHbisYdOKf/x61u3QjK9lKpTuZ041ak6xWhL4XwhzgcRnN0YUaxBSSpP00cxqPPSlCUR/Vafk3f8AIcS28TbvWpYay4rXSXC+G/x1ZemHvrE0iKCzoaGjNZGJn7h+4ZqG0xvt3HyZIq+6ELlnyRQ1gXt8j+8w2nGhJ6WxGrCmvEqL8aO5yO5weMZ4+R8RkfE6h8UqHxSoPitU+K1j4pXPidc+JXB8Rrnjrg8dXPG1zxlY8XWHc1We5afk3v8AIcSlGFS06U6tBwocTubug6HD5pcOrJqnTfq1iaRFBZ0RoaGjNZGsjEzEz1knUjFOpKMuTGV/dCSI+/JLJjvJLngwduTeTBg1QsEkuT5NcpmcF7N07eMrucdbtit7tisrs+H3R8OuR8PuEOyrodtWJ0a0IW83KkZEYP7wITLT8njV07e8lfbPxgr5pu+kxcQmk+JVcfEKmdYmkRRWdEaI0Roamhqas1ZKM9Yqekvfkyr9QhHsZ8iQ0RH3547J48uCSESGNGDiixZ0PtQKaIRFEcScSoiRcfYtfsYEsmOWDBgSLX8n9Sfm4MGDBgwKPr1iaRFGOdImkTSJpE1iaxNYmsTERxUoqOIy9+TK/vEyRWTGRe/9+nCEe/JcksmOzWDHZYJYO2B9+fZKbyOJxVf4Vuv2qcShSyQtkSoKMXRlioioiaLj7Fn+Oa4NcvA0LA9SJb/k/qP82IkYMGDBr31iaRFGOdYGsDWBiBimeg/bPQegn0nGHTUH78mVffsIRny4PZRHjkhPzasawsEsDHy4p+BbfZpstmU2XdF1i3g6VCskysiaLr7Fn9gXkxyRbfkfqX+QyxTkbyN5G8jqSI1PTrE1iKMc4gYgftnoMwNoG0TZGxOSUYyUoP3GMre690+0ex7sS5PyZNkbjqJimbmx1I4c0dSOXJGxk7EsHbHFPwbf7NNlBlOoKY5laoVZE2XT/ZsseHFjC8mDUtvyP1N/ImDHPBnE9UYiJRziB6D0G0DqQOtE6yOuOsdbB1sjeWMkSyzWbFCQoyNZHrwlI1kayMMknlZJZMM9R6hSaHJm7Lh5oxqYtKc4puohVqZ4ilOWRTTeU3xT8Gh9qmU5YI1BVR1idQnImy4+zZv9jlH37Yz32MmS2/I/U/8AIr2co4yjJHGW1mX3OqdU6nfdGxsbs2kbSMyO5g1EubKnshMTMmTJkyZMmTJkUiEiLEYGi4SdOrHFNQqRq099YwrHWVC4jxWBPiFOTo8RplTFzQ+FxPhh8OkeAqlS1q04+DuTwd0eBujwFyS4dctUbbpLpRI0YnSiOmmo0pHh5HhqhCMoStV/kfqf+R8z+5gwYMGOWDBgwYMGDHJjJvsiGN1RydGQqUir+0Uv3I6SOnIwydRQFVTeeSZGciFc6yHXROeyrP8AbucpUcwdCP71zipcrh1I8BSKtpCEaUowauDxA7g8SVriM4q8He4FeoV5E8XE22mR5VpV4yjcXBOtVOoRqScrT8jjsLaV4qNidCzPD2p4W2PCW54OgeBobYMGDBgwYMGDHlYxsm+0Fs4W0dmsnc3ZJqUoSUVF1+rKeB9lVlBFu25clJqLqzOrUN5k3LOZEoyZUoKoeDiK3xP4bQMMqNxU11EoQj5HGLKltSmRsqKfwikfC4Hw+Wfh8yFnqdCWejM6VQp0PU6UDoUzw1EurTErWnUVx+pPy15mvV81jGSZIt6OsSVTAskquDYyNjqDkXVSM3RI8v8Ai+SH7u9gn4+kfEKIuKWwuJWwuIWwr+2Kk41WPzM4ZJSOnE6cTpxOmjpo6Z0zpnTOmdNnTZODS/UDzdc1ywJev5rGyQqFSZStGpad5R7dHBPOYvQlXIuRt2c9nVq6EO5T90IT7PkkS+qr9TGL6jPK2/EH5mTbUevXRSqXdQzfIdXiCPE8RR43iKPiPED4pfo+L3h8Zuj43XLTi9Svc1vt8Zip3d4/8KjCKldx9dnDelUp6SwY9XzlSlIhCMDL54NTDJQTK1F7SlJnUeW/RWmnTplMiRRCJGKLJ/8Am8l19+r9TGf2hHYtfxeT8rJ/QzhX0eXBhGkTpwK8Ixuq32+L/l3S2tVnF9s3Ydy7hy/5efI2kO4RGrKQpPP/ADai26cNnQgSoxQ6cRUKh0bpH+ZE69dHiYs3TKlONROEoHSqyIW0iNnVIW9RChKJFpEJRymcJqbcXyXH3avuxn9xSMcrP8Zj80h+2DhnaPybn8qt9vi35dx+LR9UrvvU4fLDn6qcvTL/AJeWUlFVauqlG8kRsmdCEF04YlShl0+8IqcVSkpypLacXsl6elFvoTiKpXQryCNlJaxNRxItCwIi0Xzaq6VN6EpKvthcCqNcQyVvuVfdjP7QhRLNYpSJVqaOtE60TrQOrAyM/pHDYOUelM6VQ6dU0qmlU1qGKh6juXL/AMqt9vi35d7lWNv9y8aU6DxCF8onVp1RfVnBGSkPY1bVKnrHCzSjAlGnI1WqnGU6lrSrio6x0WHuxJvlNbPQbcRqEzVwlmBO2jl1atIo3NOqs5JCmKY54LqWSte0YXFOSd3e9Q22p5yqn11Pd8v7iu4iyE/E1421I8NQPDUDw1FnhaRKxgZan/Rwr6Pk8Q/Jrfb4lSnO6rRnO3p0akXe2deoUrCrquHzFYMjbTUujkhGFJOo91Hul6oxEmXCrzlZ9aNR+2IxcWiTwa9x1HE3zCnNSKiqSIKrG47Kc5Qq06jqW6fqKtPMqNfJuzJknLtXzOgrG4xYcRjw+j8aoTUeI2cXS4tbU1KqqzqDHyQhRyrXsW1v0zqQOpA6kDc3JVUivL95+xw1+j5N/wDk1vo4v9+MmKczq1DrVDxFU8TVPF1M9XsqiahNKPiGhXC06mZVMTUZQgRr7JtzVKCinpJbZG9nUrJHRyU1OMJ1dCWZNzKlxCCbZJojKVF92XEMlrWc4oySxjr00RrUSbpTOhRZKztZk+HW05UI6U5jHyiexsUKnTm6yNzYyZR2OxPA2MspTilVqnWqHXmddniEeIieIpnXpnVpl7JSua30cX+8ueef/KMJ9GMsuFXsnqbZTmlGhXVWMko1IybllslJpyzs6zThLVdVir7VFUlmVWVOS1ZF4U47LXVTnqq0FUhTmp0n3VX9qcZZRU9pr1qJoaGhqy1+zMfLEhZRli5Xv2IpynG0mRt8EqMiVO5ROpcRlZTlKpytOWfP2Lj8ut9vi/3l5sevbaDfdS7/AFFTBSeVCPSXTjKfdE8xIy6icx1YouKrp0qMupTnXTq0/eSU3t0ZSfrl6RS2hLLlTRdeivTa6c47KxbiiqS+teW3+1Mlyi+yYny7HFGkcOhvedKB0onSR0TiNPSVp+V05mky2yuS+Rcfl1vo4v8AeiVakaao2zqRdrrcuOvL/lpmpMxhpLV0e9GLNWpQqyjSh2JVPWnic6nThuswe1Ny2TltVktYU55J6VIx7kfowf3L01H+/Qt57cm9LzJUfaT9SYn5Lf7dQkyUxSmKcxVpHXZ4gv571OGNQn1onViboycSW1CEta2TJT5L5Fx+XW+jjH3YkKfUuKMO060qNxP9+jB5j/cZ4i8k8kMITL27cCjV6tH6iSNd1sopxUpOkzppRq/btlKEs9tko0u6n2nL3XqK9WNOmtZxcanXlPo3kZqSvm+q6kcRq7tUTpI6aOmaMhb1ZKhSnGnVt654G4keBqodrVieHqnTkamCcXVubai6dPQ0NTBVTdORmeN5lpJyQvkV/wAut9HGfuRZSl6oX2kVCGlXWjSpy7Z9VxFVXQxFVI7Clgg+2msrePTcmouNzTqEXh08pbYKtTpwUq0as5OqTgoU3Tyq81tQlPN7LSlB5hTeSpHZ1JOBJyUrtJka86ZKtCcY1EygJiMCotkaST7nflsOTItjMscsFSXp4bHqXaox1dGJ0YjpHSkSpSKCcblU210yE+kp8QUFHilJi4lbi4hbMV7bsVekxST51/y6/wBvicXUrqgypRlic4uMJ06UakpVpxhIjFqXViU63dVomVNOpJSVSpM+kq1FrlJ9pJzwt0T9YoxxZxWyXqUVm4716eYxhQcS42Spt4U1Tk/ecitPv65ELeUijbFOnFCSKdHLjTjEZ3PUdxZOx25dia5ezjDu1IkmaGhpk6YrWl1UzIpjkhwpzHZ20x8MtCpwa2Y+BQJcCY+E30GrXikVZUr7x15JRt417ebTt2KFFnh6cjwNI8HBHhkO2MmxudVnXkKvI8TI8U8q6R4uOFXTFUN9o09Yv6INvCzmE+pUpzpxcnlSw4KWrxiUq2V05TI2iRGhgjDAiFGciFOMI9h8snvz7csHbH9SQxLKcBQNDU1Je+mRwFBigOERJEuSfJIy+XcexcqPWxExE7GWjqVEeIrIV3XHbodsh2x4Y8OzoMdOSMSR6jZmxubltKUq6qxH3KslKNn9VSaVTDZUu4wkq9Sbp0XJwhFJRRoaFK32I0YxP6bNhSyP2TZkybmyFI2RlDaNmbdsoVTIh5Em0uxsLA4nTedWhS75ibQz7mH5dXmXZS7ywzVmrMGFyRox02dNmjNDpnTR0kOih26HbIdsh25GlOnNV5NQrKcXCMIULyCXUTJVMkKCzCkkRiKJgp0pSIU6cF1UbsyxzY6nfdMybNmfI+fYdTBtsYRmJuOWx7DmRkRZtycTujMTEWKHYx2Z6cp4O5X+3qYMGDuZfPC5YMGqNEao0RoaGh0x0WOiyVOR06ySVZHTmQjhwpkaYoiKdKUiMFFbMeZJxPYT7YJwNeXc7j5NCeB1BTH3MMyx5M4akJZJPBGSZ6c5wbIckORKvgjW2E2ZZHlg1RqSyXFSaNjKHj5OT3NRrBlmTJ2Ox2MGhoamEaxNUJEKbZTooysOWDZnfk3k277G5u9tzqZMbEoMzKJu3y7GscZUTfJsNjyRYpIZk2RsNkjubdurgVd5VQU0x1UzqG5shalzjbBqYZ35d+eDQ0NDBjlg1NTUwdz1HczzwYRGvbxfiISOqKY5d85I9zA1k17OJGIkkf3JpNN4WWpxGI7o2yelijFLsNPDeDI1glPUUyT75kKZkh9WMmGnshTizIpoyRwe6lFpL6zJk2Njc2RlckdzJnl259+WDBgxyybGeTpxkStKMiNsoEqdclRuDq3aPGTR8QyK9jFdeDNzd5cnnbJsmb5IuaM91JcpEF2USc+0km8YJ+2SE+2ER1GoZ9I2ZFqRkiMkxpSSpJGsUaoy4kbhY6lPEqnpXcwd+fYzy9PJIwYfyM8tjdGeWDU1MebCNUOlFkrSkzw0UdCoj/KS3r43nqp+unc0yNalKc5pRjVSXWlq6yxCY3ki8Oc2xboUXlSTH7FSMspZaopnTUSUChCKFGKMnc09fZNko93HCrS7ZZszdm5sjKO3Jp+TLNmbHY7GpqzD56GpjyZNjJkRqYMGpgxyxy9BpBnTOnElQpM8JRz4VpO2qEaNeA1Wy6rjLrQRGvRZ3bl1oinMyOQpd90hV4kKylH3a94a6RiiaaXrTT7asSTHqVk1IeDCMI1NDUwYfLHPBjlg15bGzMnY7GDBhnfmlExE1RjlkzyyZ8j+Sx6jp02StKLPDHRmlGnUi9qxKaS3k3TdKQ5UEbxyvQ41cOLkjqelVWOfaUsRl3csxJVZTllmWZMj5ZMmx2EzPPPPty78+xg1MM7mTYzk788HcyzYyjsYRqYxzwYMc8GOWBx5dz1GWZ54Rqjw9MdnAjRe3QnmnO5pJ3V1rK8nmldUxXdGRCvDetUiyKRgwdzJnm+53O5gxy788GPPkyzJk7Cxyzy7csGOeTJkyZMnYyvJlmzNjKOxqjUwzuYfkwYeNTuZ5tZHTidOB04HbngwY55Nly7mWZPSYMPlg7C7nfl2GsmMHuYMGFzyzdm5sbGTJnyZMiwYRoamGdzJk7DM8s+bBhGpqzEjuYMefJkybCfbJlHpP//EAC8RAAIBAgQFAgUEAwAAAAAAAAABEQISAxAhMQQgMEBBEzIFIkJRUhVQcaEjYIH/2gAIAQMBAT8B/c3rqW8zEu+pZToVJMjpKk0Xcp6c8CpLSDYdU90ujcOrtJLi5CaJWUEZwQWlpBA6soLWQ+5klmpay0gVRKYzQ0JRcXkolGnbKleSUi8uJFUSmWmvawRzpwTzptF/3Kt9OhJJJP7fP+ywpgsGoGUqWemiyktpLae0Wa1Fk81uPcby8CcEzBiYVlN0imJF28iRaipRmipwTl4Kyj6Dil/jRha0tFPUtLS0tLS0dJbHKjQrcjyW5WeSDwVFH0nE4lNVKSMLSoT7HE9pw+uIjidh506mhcuRbCKnl4FyU9GBc+J7ThI9T/hxNc1QeR5UDJybJH7SnYq3GeBblROhSynpQunVueDDFhur6v6PRf5/0hqNMoI+Up2HuM8C3KsoiBdxXjLD9w+OwVvUP4lw/wCZ+pcP+QuOwXtUYeMsT2sklkki3LZLSNhdx8RfyoxHOiHweNVqizEwn86MGo+He18q35Ke4+I+1FS+YoxU6bWcRipqDDk+G+x9GSCCCCCCM4LS0tLS0tHRGc5aGhxPDvFUFfwmqr6j9HxPyP0fE/Io+F10+TheHeEmmWlpBBEdackacl7Jk0gggtIgkkYjQ0WTz8kEFol0ncairYnIs2LpampLJZcXFGrKdSmu7JdSExUnjNipnpLlexhe4o9y/ko8iFm4NsmkvOUvKCPsTG+SEVaFL0KFBVvywWlucsuZcy5jZh7lO6MNNCFk8lC1Ru9RiFT9yPCy2IH8jE5EVUSWsh80lxdnDI5KORIkgYskskskTlUpRQ9SnkfKkQRlTvy1bFGV2SG28l82h7d82yCDXLbJqGJkEZ2kFpWoKadC0dJSpI5atikZAik8RkqTccEFOgzc8kH85RJTRA2kPE+w3yTlcy9l7E4PULi5lxeXSUl2SaRKLSGaksuLj1BIgajYVQkyESkPE+xM9lh75QQWrkggtLTYqbqEQNwPE+w3PaYfXdf2JntqdF0p5rUWI9NHpnpssZD666c9a1FiPTR6Z6bLGQ+ejf8AYYRaj00ememU0x1V1J7P/8QALREAAgIBAwMCBgICAwAAAAAAAAECERIDEBMgITEwQBQiMkFCUQRhUnFQYIH/2gAIAQIBAT8B9Tx/w8m9N9iGsn56799qRyRiQk0KV+i9WKOVvwJN+RKvY31yhTEtrL3scyU5FNkdIUa906ZfRe9mNij7Shx/scH+xwkPTZxnGzjYotCZkZnIjMyJSMjm/o50csTOL+/uKKNTUiuyMzIUZMaaLMizjOM4zjOMwZjL9lS9O/S8GpOUu0RaLFoL7i00ihxsloji0WLuvaWX1uNmK63FMloWaaajT9Giiiumium/Uoor2tFf9estF7tnzY5GbFbE+9DdGcjKRlIbl7R7yePdnkoW8vBFfKLb8irEvP8AQnbobSliS9q9n83Y8HIyEr3l4Iqyq2/IiL8jTfzGv2nGRL07MkZmZmZnIKVl7MXjaRTNNUXtJ9iBaotH5ET/ACNNUzX+aHYb8eivQ0/qPwNHztW0+xRxjVCSMUV3GiKOx+Qyt36K9DT+ol9H/ppL5bPBHxtqCRTJCRRHyPyR8bfkMiUNIfo2W96KK6O59iPg+5qk9RRdULWX+LIO0Xsu0huyD7Fn5D8EfGzH6S9WrI6WXgX8aR8LL9Hwsv0fDslpY+TFGKMUUS8ClSMjIfuNAickS0ySNfpfQ/SXraAhx7kVQzX6WUUUOJkjIzMzMzZlvmzNmbMzMzORnKcv9C1L7FbdzuaWqkL+Sj4mJ8TEf8iJq6iZmjNFosu/RsvoujkRmjJFl7caZxRFGmZGRyGVmJQh0Nl3smWhi8bWzuOT9HIWCKiyWkmSg472JjYvHo0ikYowRgjjRKoonLFWOPbZ9LZZbG5FPdTaJajZGkWiy2ankh9Poy8dFkH3NXwav0D8IY+j/ZW9FbYxY9J/YqhoaNJXE1F8xqd3ZD6enJGaMltRijFGCMEKFGouxq94UiTVFoeyGMut/wDXQiUVIarsUQliqMovyfK+rExMFs2ZItF7In0PZ9VFDEtl5NSPa+leN7ENliYyfjph5JbY7SK2x6O/36PG/wBSKZkZbfYcjNmbNN2Sn3MxTJuhvt0w8khdtpEum7LL28dCOyJzvwKLZHS/YopeOij+jCJxxONDWZxmCMEcaONfsUKdkimWxtjszRcT5TFGBxnHvZiOSXgzZ3ZHR/YlXstV0iyy2ZPeyzJmbOQ7MVfcbobbErI6P7Eq9preemtq9COn+xRS9tPu/SorpzZySOVi1jlickTJeu/Tr1bM2ckjmZzHMjkiZIvq1H29OvbWzORyyOVnMTnl6j3fvf/EAEUQAAECAwQHBAcHAgUEAwEAAAEAAhEhMQMQEjIgIkFRYXGRBDBygRMjM0BCocE0UmJzgpKxBVAUg6LR4UNTYGOy8PHC/9oACAEBAAY/Av8AySSgfcYf3mKg4RC9XPgp97r5uKngXq6f3rDdrBasx75OX9tBvn7vJpWs4Dkpz5qFkBzUTP8AtvBQ911WkrWg1axLlqNAugJlax/sMQptKi1uHvePuMlSHNazieSkwaGsVKQ/8BmdKSi4qFn1U/7pD3TVmVrH+6UKoVQ+5TruXDd33rSY7kcLSTw98oqKipdQLYqD3eVm4BTB/ulSqrYqe6zY3ossOSk4hSeFQHzU2n+5nd3+VZVQKgVAti2LYti2KgU2NVIeak4qTgqKbT/a4uopacCpaR5aGxbL6qqzLMVmKzFZisx6qpVT79lCjCHdxPcUvnpEbv7dMN7vcpm6t9e8d17iioffp/2Gd0pqMIdxOxB80S1uEbu/rdtVNKWjL3uar3I72t29UVLqquhxuqpaFfIzVIctCWnIqfusHAlRaD593W+ipdVVunp17il01S7cpKakes1T9qr9FOV0veqqt1CqKl1VU97WF3BS0aoaU9Ga1SipiCkVMKRMFToq9ZKctKXcVVbqFUVLqqqqVOF0tOvuM1v0NnVQu46cLpG6YUjdrNUjdqxCp0kv91EqI0RBVVVX3ia/2vnpbEdLbo0GjXQkbtYKRUitYLctUrWC3KSGI4QTAL73EaI7waEr+GjQd/IjTqqzv46GzQkbtZt2qVMKYgtVy3qYgtVyHpm4mk7owTv8ONWOiEL9vcbO9qL5aEIy7uovoL6qWjNbel0iipi7VN02qRUjFazVuUbMG0nMBPIsywRnEQ0R3tdLbpbNCvyvoLhfQrI7ospWVTU3MHmp21n1U+0MU+0jyT7SxeXYZG5rd5ULW2gecF7X5qpPVZCfJSsfkpWP8KVkOqkxvW6RRgphblI3azVuWq5TmptXqC3FGeJO9KA2GyMY6IupfW6QVJ9xt0aFSaVlKyqaq3qtZ7VrWoEV7b5LO5fGVkJ816QWMZwqpWLFKzZ0UsPRVWcouYSHSmoB7yd2JRLj1vYPxBNcOyte2zOs3gu3+gELP0ggPIXWfiTCPuaG1bbm7o3SKkphTCkVIqYUwpFSK1moBrjZkGoTvSPDnbIDvtndtTg06vJZlmKqv1X2J/CuGgfEpKipeeQUltubZuOEHaps9I4HMU8g60YL+p/mj+BdZ+JWfh0xzukUYKYUxdJ12s1blquW9NFvIRkYwmnAOL+JOiFNbPcm807nc/yVV+o3Q2qy8A0f1aR8kQmtImdtzeRTIb4FWkjWE1/VPzR/Aus/EE3DCVlFPLdkPomNMdYgfNBoJhJWjxnaU5hJOLWFw53SKMFNTbdJykphTCkVJyHpm4mx3RT/AEAGGM4b9Ed/A3zUk3mnc7jd+q+y8AuOELLd+rS6XNaXNxEUU4BN5FWXiCP/AN2r+p/mj+BdZeIL/J+qtN8R9ExxjLCfmm+S7XYncHKytPumB/i4c7pFGBum1UUipOu1mqkFJyBYC+cwE44CwcZaIU7pr/bSj3TeadzuJu/UpG6y8AUKKVEVFfqUlCLeqEYT4rZd0QQc50wYRTW42Wg4BWBNcJQhvU5r+p/mD+AirLxBf5P1VoeX0TW7Th/ldFD77cPyVoNsVGEJRvkUYG6YUxdJykVMKbVuXqXNxRniTja4QdwMdERVLpKehQqTfkspWUrKprZ1U32bT4l7az6r27F7YdF7X5JsHujFOudZfDgQX6r7Pwi7VUDcfEo7ZrbHYh47jKa8gm8047cVEwCDdWMlZjdiv/qf5g/gIqy8QX+T9VaHiPorPmEOTU1/3SCibKEHj/lGOwzWHjdIowN0wptukVJ102qbVBrzZmNQnY343bJQvi7FXYpi0U2P6r2R/cpWQ6oAWLF7NnRZWdFs6XVVSqlVOh5KRKqVOI87rPxBO5qO5AQAinDfNeaMVIJnhCi1juinZWnRZHdF7JwCLXN1o0TWuEDNV+aaGFsjvWdqztWFgxGVFEdneV7B2LmE0+ihqQzBA27Whs/iimPs7fBZNhFsarWc1dtfiaRaOBlsRVj4gg6ys3OHo4STgLIzhLohisd20b0CxupLMUXDBh8Ssm2psyGiEE5+OzgQAi709kJxukUYG6im1TF0nKTrtZqAtpCMpwTg0l3EmN8N7lgY12JNc5tRFOdAwbVYmzCYNpMe8E5DBLzVh5oPgA6kkzwoqz5p4d2cOnWKw/4VsFq9lswp2LOikxoTGQE+Cwva47ZLK5ZT1WQ9Vk+ayBf4hoEcUFlZ0XwftVR0Wf5Lstox5DntieKnauTrU25bZjaSvaP6rsIZaljnNJJRGJ5X/UKbY4sLnGGtsXbbO0dic14mirHxhM9E9wGGgKzP6rM7qqnroCO+6qMHXzCm1Uuk5Sdd65kWx+7FO9C0Bu2A234miJxprjkwzTIbnIOFQtRzg0/BD5IFsnD4e8P6P5XZ+Ef5TRy/hM8N1iHR1nSTrsG2OHzQfg1DtWKE2zVnH4IkIHhf6uzJbtKw2tkQFRAf+w6PZPAmWbauKs+z2cmC7sMPulNLaiA/hYt2JO7ZF/pPSU2L+o/mD+AirLfjCs/DpjndVGardRTaptVFVScpOCixpfOgTi5pbzvaB/3EXOFHbU8c4KzsoGkCHVBUE1zvId4T+X/KsD4lPYmeFSmuzxMdcfynWbXAGs07EQXttWkJ5IgfTREqoH7rnfygaqxDTHHNeVxTRZCMNic9xGIEQhsQPBD8w3C/s3hVran4BAea8rux+Eqm76LCZZkW/DH6r+o/mN/gIqx8YVn4VExRb6MO1YiCwuBa7BiQtW5y6CALWE4oI4X4oVlfVHWVb5hTasqpdJyHonNxfiTvSYY/hvb41aUqUWWR1/SUB2QVnbOGG1kQi4iE0wnYZId35M/ldn80OKs8LXHV3LVY6f4VY6lpDGPhTvD9VbzGZqOH7wjLaneN38psF2V+yJZcYBZSgw2JtRvoVC0b6NjZhm9TkED/AOwqSCrd2Yj7qe77z0LQbJXdk8JTQaf/AIuqcfixfVf1H8xv8BFWPjC9ZHVsxCfNWzIE6lE1xmMEC3ev0OCs7MkBuLqmQ/7hVpAQOKc153VR1lmVbqKiyrKqXQa8sO8J2J+I3lj3PbOMWoMx2pbGM052N8XGM1EutT+pHVxeJSZNbVQqhWUrKsqyLIvZr2ayKdnNZFkWX5rL80BCvFO8H1VsISkYrtET8VaJ7vxuC6rsVnvi+601oS3KPpP9K9q79iGu/wDajCMIpv5qD7RoduBTLVtk0iMCzYULW0YHucTAbAm2lkMIdHV5LsfgQH4irTld2PwlWX/3cuqf4/qv6h42/wABFWPjCd+W3+SrTNDBOCYw1IjFDEYCBRJxYPS7ctVavMCCXQT3NxTcKoc7qo6yzLMq3UVFlWVTagLSQjKcE5rY+Z0RdK6Xc5dKqbzTvB9VbTEXwkre1cdYEka0NitLP4sZKg0dFYfhLmfJO5K1i4AQU7Vq9tZIQtrIlOg4ExoE2R9qoQiEHYYgfDhiEW4MbdxaVldSAAbRdlbhdEMpBWjHseBUSWGzY8l24L2Vp+1dl1TJpjwVnFpkFEjeoYfjj8125xbAOeC3oEYiSsvEE78sfVPwfdEVZHF8O00TQCIGNOSwf++H+pH/ADFaGLfhlGaHO6qM1mWZZlUKovosqbjbGJlJOkYR0Ro1+V1O8oFFYsLcW9RfYWTjxavs9j+wKDLNjRwaohgjyWX5LL8lJjP2rIzosjeiyNWULKFS+qqqrMqlZlnKzFZz1UC5RKsvEE78sfVWpiMWGCs22s2hplGCZgyj7pjsRssXrPTYpjZFH9aeYSIZNDndVGazLMsyzLMsyqFULYtVuKdAVFzcPA6Iuoe7pLRrdLR2LZdaPbmAQPpmz4L2zei9u3ovtDei+0N6L7S3ovtI6L7R8l7dF3pqJpJnozv2Ky8QTQ2zY6LalRd2axJ4r7J2fotXs1gPJRPZ7AnkoCxsYclD0dlBexseiqqlGazLMVmWZZlnWdZlmWo5sfxL1hbi/Doj3y25JnLubTkmdzZeIJnh0281UqpRmVUrMVUqpVSqlVKqVUqTy0qBeXHedEd/C+alpb7oq3PBM5aEcUFETGhacky+V877LxBWfg0xzVSqlGq29xRa/wDMERZzHOOiO8rft7muhbVorPloMwmiax1RoWnJM7my8QVn4L6qt3/CnWKqVtRroUVAqBUCy/JZfktdsR4Yo4Gwbyhoi7ZoV06aNVFxgFIxUNujKKmrbkmcu5tOSZPubLxBWX5en5qpW1G6ioF8K+FVC/4XxdFQqnzU1LQldRUVFRUVFRUVFRUVCsp6Kh6Kh6KhueN4UfwrkILb0UygGuGIqqhGB4ownBW3JM5dy/kmaG1SW2+y8QVl+XcJf8qhVCprVovNZiquXxKh6rKso6LYqqqqq+9kERCwAer3IkQFnCCd6xvVZ2dUYtOJu5Ta9Ue08EGD0hO8osJhj3KVvaqXabVfarVfbLVYndueBxX216+2HovtfyX2kdFA27YL0bplu5bVtW1GcOZU7Vn71K1Z+9StbP8Aeiy0cCeBirKfxBWX5en5+6AOdCMgpGaqti1vlOKxNouCotnVTUL5Kh6KYPRUPS4riCrMfeP0XmoE/NWpMJuXterV7Rv7FJ4PJqlhC2KUFQLKFhfZtc3msn+pZPmsh6rKVlKLt+jrEdAhDziAp/8AxQiIKy8QTf8AEOeDhlBStrTovbu6L7Qei+0/JfaQvtTVi/xY9zgEHOmRRTviQoTgjiez0fJSH/CESNyxP8hvUbxAlZ3dV7R3VZ3dVtPmpNK+JNxAxbRVesX/APK2xWf5KTondBQtTiG7YpNaPLQm1vRZYcl6wvhvGxRa969o7opYocbtdzvJq1cUOIv9ZLcvh/apw6L/AITTY629WUW/EEzw6Y5+5zUrolUU75qibhgePcwLXKj18fRVf+1Zz+1e0+RXtgsTDFuw9y6zOyYVLtqqVUqpWYrMsyqqhVCjHaEzw6befuMm9VG0I5BVUkIklVesRGsuKi+m66igo9ybzoWfLuYtJB4L2tp+5ertbU+a9par2los7v2hV/0LZ+xZWfsXs7P9q9jZ/NfZ7PqVZ2TrBrQ4wjFdE2P/AGwoVAwoYZSVnAmcSrOYEtqgbm8+/wBykInetmlNY2TO5TlvWqPNGKlPZp9t8YHyuKN5vqmdybrTnp0Cyjosjei7HhaB63ZyXRDwD6qHJMw1wqyw1gVZDgo3Dn3M1qtc7jBRDRvqpwWHbWShF3VYfWdV/wBT9ym+1b5qXant5rV7X8lLtDTzC+B/mvWWLvJTiOYUvkp1W9qnZsP6lB1hZ/uVB1WVTCqq3f1Di646B0Bz7k3WnPuuw/m/RdEPAPqv2oclZ8nJnK6Cbz0okyUQMXmgMLLOP4olDFbOcoKIaJLEP/xGFo923CCpRDtq1jEeFCAU2S2GKwtDl6yzPmjhtXDkcSyttBwkVB+KzP4gthCpfPQOHaQg300/Cnsc7FhIgo7k/F8TiLj3BHG7N0XxdF8XRbeizC83WmtBZx0WZvRfAqN6rKOqyfNezK9m5ZHLsMj7X6Loh4Ao+FDkrOO4pnJYXxWq6fFN5qaOEgw4qQVcJ4hHWxu4qGAeaBwNgtaGKoWAPcBwWyAG5Y22r/IxRdifE1mpFerIhzWsdk5reFBEG0dBQhBQkXI4XR4FQIwk71FoLDvbJaw9IN4qosOlHi1WbMTCTtxZVawnlKGGEIbd6Y6zaX2lm6bmtUdE6DgtZ0GbAqvVD1VD1W3qvi6rUeWngjZvzD532nPuuwfm/RdECyGQLAGCMqlDU2b0zDZkwQxNhdVNJdGBXrG9StTC2KOBsY7YwRqtqOuSVJxQFm9wZ80cb3FsPiVMUZIR2UgpRHBSryXBREFrAqMYKWMH8QgjhJ6oEvcWoufM74IkTad0017bQmz2tcFKO9Y2ar/5UDJw2aNqBWCyIWDrMC0FStdgPksgERsCwRAgsYoe4tPCmPtMWICkKLNBZ2rO3qqhVHVVCDiQYuvfDf3XYPzfovMJnhVSs7uqzuWcrN8lUdF8PRVMvmhGqNHEbYJrp+FYnQbzRENXnVZ3t4BBo1uLty1aHfJAOgTsCMSROmJbHBSMFDctUWkd4aiWl8NkyoWjo8aIRj5TWyHNfRNxkgb0Sw1mtacdi9GScPwf7IqLZOC1pOpofdU3Hqv+n5gFTZYH9K9g3ycicNoI7nINnLfoHQiVW+l2xUGg/Dh81RiyN6r2fzXs3LI9Ud0W3osyzhdhgQfW/ReYTOWm3moPhiO0BDVI4Fa4wn7qOM1MgjipxWImQUbNxIO1RbmdWaJWKETRNOKAC1IBvBM1SY7dyhiceazKETq1WsQHfhRJpSMFiaZFQqRthBPBaMPDajMw4lT6o7D8JVcBGwG7Hs2qPcVQ0KFU0PNBoNTBTtneSnbWvValvajzWrbR81Bz3g804OJdJTFzu67F+Z9F5hM5abea9WjwUY0qrOLQYfJQpDzTmwUA0DkhaEa6cQ6UKcU2DpD4d6h8OxFgaRAwntUFjawv4BNcRhiKFFmsMO3YUXmuxAOM9ydiOqhMqEJcFCJHFTPkoOnuXpBldJDeiE6zPwmXcjuKBNAQjQCKotqqVVMO+SYN8rqI4u67F+Z9F5hM5XRcUHPjPYFha50MMaoRubzTH4nCGwUR3KZgEQ100DU0WNhGGKJNETbwaIwUiMNVIKaOtOqxQ4IYnSCkU1omjgIa5ZgZbk4xjwKgVhcAVH+VVcEWPqKFawub+IdyL9W7YsqyLKbrRx5KqzBVuB3FWbuPe9i/M+i8wmcrsRGqJBercbI7titPSunSPBMfSNIbFFN5rWhKpXFSRlWpUgsFiYnehHPGBRDgIcbtyi5h3SU1IRidhoiI1RZGHFYvgAlzWvKNZonyUm3YmqdYIuAoaJr9+9Ndj1AKIg5XTUEwj4UCTVYGiEVMRWVUKqVmUkA4TUmKbCshWUrIeimw9FS7A2pKg7MTfsucFJZlVOj3XYvzD/C8wrPlcRGScHNLi2Ud6i5gJeNZbTZinC5vNTJhuRkXP+cNy2rDRHDVGEOICOqE59N5RAxR5VuAiSRtKmsRmNi9KcX/AAhgGbfJQnJAt3INkhuReBEhNc8YTDbsTnxkacF9EJY4rZC6Gxa1VIDzVemjNvXuiTAw4JxJhBpU53ZlmK2KgQG2MFlKojqlTsyeSmx4Xxj9K9p8l7ZnVStWfuUiOt/YvGf4XmEwfhuyxUHjAaKDLd0FObeVzeajiUWuCkVia5SRxGIdsjBRauG0KIG1QdA7VNYhVVQGICNEXTO6SJJJjSOxOLYxcpLVIVpF2NrjGexRbrFQCAgILEMUHfJDap13XTCyLKspVIXbO5le4ubW+d1VNG1njjGt843azWnmFOws+i9iOpUnPb5xWrb9WrUtx5tWoYjeHwUha/vXZz2oWhY0xnsTidii4zWcKVoF8JWRvRSY1ZQsuhmKzLYprKjFvzUAIKZWYLC6nNRaShBb1TojuiVgxayg0zQAkgAo2hgFCzBPNTdDgNHdzXHepXVVVM6U7qadFRZbqqqrdJTUSpaRixUvk49VK0d1WcrN8lTT26TAyboqcnha0lqupuRNVqsZOpWcR3BQ+Jaoh8lF5jfS7aApNHn3G3RrdRTGhmWZVvkqqq36M76XQ2ImS2LZ1WVTBVTdXRosuhRUvxMJBXrBrj4ggLUdVaOBlhooUVVBkuKia6FFuHFbzxUltuoqaVVVV0q6VVW6t9FK7lpOoefdV72QUBTcqLWZ8gvZy56MaBSF0xoyPdVWZb7531Uxo1W+7jfVQuzBSQaCMO2+vutFl0pkRXHhoTN9UduhsCzd0dEXUvm1UVFO7VvotsUGxoqrZ31dGvcQxDFxUA5pPNZboXVuooXUu4LKpBTcbtqoqKMIKZWxf7KV01Ja2hA3VgpXTGhOajJbVJOMDXb3NdOqr3kwCpsatR728MSl2g+YUfSRKm1h5LXsXk71OycOKi84RxUcbYc1UHzVFRapU4G6KipxuqVEoXatVMlQUtCqqtl1VW6EFIIRvgV9ESJnddW6iyql1FTuqe5zAWQLVi3kVqW9o3zXtGO8TVB7LM8QYLWsiDwK1mOA37FnmoB81EyHFTEV8IuqqqRuqoqmhtit/JasbplUVFEKagVt4KiiVhDK6de4pdXQoqe6TvqpgFTYFESPNEMtngblEW098EAC3jxUXNH6QvZWmHfBTJCnagDitRzXKamx/BRgobVNBQQxTgpKZUMSiCpBTjdFQIuAwy36NdKmnsW3uaKmhL3WYU2BZYclq2loI/iUrQz2lCFoYcZrXwu8kSWmNJVKyOgpYj5LELUcgnAOohq12qclMDqvouKMWoFoUkBHyCzSvp3e1VWxTurdRblXuKaVPc69xlClLksRcXc1HHGcV6sMO5a9i1x4FD1LhzToiAAQjaS8lIgx4p2Vx7il1bpi6t1FRVvpdVbFRVKroS9xrp006d1sWULIPJUuro005i6RuoqKqldS6vuFNCnutVXvq6P/xAAqEAADAAEDAwMEAwEBAQAAAAAAAREhMUFREGFxgZGhscHR8CDh8TBAUP/aAAgBAQABPyGdDEGhon85/wBl/wB25/CpSl6UpS/ypf8Aux9GhjX/AI33aq2JJaff/neqEEGhShoJclL0XopSlKXrf/GxjH/5IQSQM0M20ctSmiR8PomL+dKPAZsvhoJ7D0Lu7N6UpSlKUpet/wDFSl/8j/hN0/BkxRqd9zKfdG/WlL0vSl60pSlKXrSlKLOmWNapHf8A8dKX+T/hgiBL/wCTE21WqKLYeogppzPKNNyutKUpSlKUpSlGXrSmy7l4PjxkKrpbsfGEwXC27/8Aiv8A0wNEFlY16DarqOwX/ljHqM81X8P2RneEUpS9L0pS/wAWfAejUyvdmr17I+CZDo9gNGyDjb/4MUJ9mNfVKY+4Zm5H8z/i1R7BD6ww2KemBi/5McG/BthO4+PGBuY5eSQXrH9iLDJxuymvR6sQv/jz/jkjTjQYYvVjvQaa/imbH9IbRfJJRYIihJinvFjUS5Y17HcM2rVvd9EL/wCRCE6T+EMQbP8ABOsOAT7i8wkWnRdE+izeC9zFfbFZTqui/nWQ2lBXRf8ArQn84TyV/Qf4BL8BTVnSushCdEIQggigpa5ZzrgMC3OD+KEL+VEmZPQRmw8hIl/2hOkIQnSCS3oluouX5F+rP3M7Y7f06bsL2F/UCW1fE/oAkuF7C8Lo3QyH/wAHxox0X8CGpFkTTzCU0iPujx/Nf+C/xXSEIQhCEIQhCGTuEBPwLsJ3Je5eCGnvCX+Ylapjv9rG7WoY4fVQXTZYaNG4ggnXXRk9TUQNGbyH95jezyofRAPsrI1qoL/i/wDjeiYhIQn/ACAEIQhCE6QnTJko2NamiUQQlEXSocE9afTQy3whT/Y4k9x/2wzmwOwK4HgF2ewScewVas9DUB6DG7wGw3lUU1PwbUfhmhH0PP8Awpel6UlqJY66F/zAA+ohOk6QhCEGbHjyQJIkkNRh9J9440RFkzuhLWTIY1eg+ijw8jsI7SOyjsD9yPB7HcXsdj7H60LldW//AFx/3Yx3+0f7w3dR9b/GjZSlK1qjudETubgMn0n8gZj50qb2IXWeuiE/hBonRvq+Ohb0yZ7Qj3fRS1cEdMjtgzoxqeHGLcjRGI4Yww1xua6Qg0QhCE/4t9aUpSjZRspRhoNWhjqoPWjNcJGRbEj6TqQwNPVC+e2FJJbIg0QhCEIJnomzXReTFzfQ4XubMFbJsZ0iNWYhOjXRMhfgeughidPL/wCSE6BRtEq2L0bKNjY2N9aXrRspSjZqi6meHBj3F6DR30m8CGLDrCEGhoaGv4XM3GQfBDe8KerbIQhOsINEINoEgvcOwvgSWd5MkJ1fS5FqM5YqgM2MfRlGxsbH1vRuD5F7j4Q+UfEPIYcKsfZFQ2J28fDNQRyvcYtUQYQ9RstRuEZsM1fI1qxTEl/g+j/5QnUlboExzWJtoyEGhoaNNDcqOUaZj+D/AIsY+RGvIdwTsn4HeyzMlDiGxH/gHyx17v36iRWqFTS0pnTLTJA6fsNEFU8DxKa8IrU3lx7Mbxb4uSLHh8M2Ibu9xq1ROglj0jMNVOgDEN8ErI6WGGH1FL/wooDOzhGJ5U02GMf8ahoVbRTRBHf4ErZsb7fMfCPEP/EJ0zi7m4PPc1YNlg0QxbHezLws8t0gl5R6DxR+2aKqaEMZ6q6bmZn0KODQ5vT5HnRRCG5QyUYOTKyQW6EaiZRtIp3NK2cYPkTap7t9mJbiRvh5fJg5TcM2D2OQNWqGhjgPUPRYruOEV/GK/l5S9aJaohoWgfM/YYD4fMe2hVVxLwV/BCwr+Ib5dK01naUbX9JQgtJoWPKnfXoVaDfEy9+xvgY03PV2DS2KOuRrkmLLuQhDK0Y3yFCz0R8CxtUPO0IQSWqYNAl8EISOiwcDmDbojkDsaNMw7BHFOGqOT1vPhiTSLxkHwPyG7Ybsxi1QkNRtqEtUd0XeLvF3CK7ztKQ2Hn9iQv8A2J6sQvpPYRy+I28PAqq+QxyvnJk+RM7F8Hg/BCDZbdyXCVMMWUu72iZuKtmYbzwQhDbQedkJKbT1wYOlFuTgaElcuIk6XJlaDyK6eflbDrw40IJ3sMWqhHRJ5GkPHgnkb7AqcIbpokpZ5VRh19EQaFAmpdfDORs5ujhfg42bDKLfUR353HTSr3N47C09jDVX7n4NTMmyQaLpLOgiWjV0GhOouEfUm/xE3VyuXqIu3oIcD+zHUSKic1FWp6jPBODhlrwh7FE16rA6ElTdGyIoovpOkN25JwPPbwIdqDxZ/Ihob2El1JDhpjuzJ9hlfgbJxqMZFImU3nA3BZ9WyEI0qqu422rZC4M1ITJo6tRvhBOB51IK08pJGzVDUbQpMpewnr46eruWHhTOVDblJ3Rzj1EsXHyW7lFofgQ3v+SswLyemLBHuPqLDaPWniLk1CQkJiwFrgqnqLpIyix0XLtuKlMvUSriJnOhgp8nqPXGgxKk/wAlEJWUan1MGoaEnqthttSkjPX7IeW2TpsOudx5dHn/AAaKcJeSVo7UWqqo7jE4pFTCEz06QFyahZcmg+wQhqVBM1hY5HKzKW5oXhJ6EIXX6KvNCQmi4ye6PEsPVgkHHKgbPpjcJ5qeqcTURYVU5Wk+BroQQQ1hB2Cq5FDQJXguaYPUeTJ4g5LsLQeOTk2Ii4cdXo5R5GpQaqTfbpt7dxdFTOJMajaFgRLkjsEum3RDtcSNIISOp9FNyN6IatMrk8qj8JdJ0b7JXEHsVs6XOWF4SXgSuP4INy1ERKm/QaJ8HeMYnfC8miIPZEXkI4NZh556PQ3Vyhs+0cI6eM5B7DbCC+Nk9ouSTQhar0PoQxHT03JC4ZgymoxG4WvROcexeiV3g0+nwHSeUmIaGNhNjdSxyKnloQU0CJaaPnpiaZ5Krzp3JH3L29n8Gz4rgMFh9A6xWavkvWm6NHge230KaM9Rg3uGhcv3FsifnoNaNKHoua6/AVb3TJI2aedOC9OQVROzXjQNLrfq/Axw9P6h+S/N7Br+4E9B+uwq13djHwQSOmpxbLqJih7N1DfkHXNboG14QNbQ0sCtwNDN3LRJgcjGPqq5yYfB+R2GzKwsMon56J410d8BKiLowLWq09jTB6bjbay+qwljsN+fXp3B1iaTxm4GzgIph9iu4rwSXk51BNfVjBY5VjY5K8CWr/CMPzCex5xkkmkw0vmELQjgJ4D/AM462DwIjq4eReWZBCkzMiuRk8GjR8lzmtEzGuBa1vapSdgcituD+w+o541RfLO+J+5TnpqbBttmWhaFz3EcGy1TjmX2CmyS3h768jdtnCzmRtRinjxpFvYy/p1DHfuPo+jSFrjTpS6LIlyJ9l5ghDZbCaKehjN6yrgTfRLTW32RjwEREhK6C14Gha5FKWUdOSUqF2YeFAmMui6revJXV36jtG82N9ahM1qVLj9DUFCvc8z1HvEencGPbhEvH5HaegtUOJ3YFDLyXoeQZ0QbhXRDprGmz6GK67Dnos9x3GnifURJPOP3EPZGLQWxLJjseBJj4H1PSIFeykt4psmwcKL10P8Aqj73RYs4EMZ/ag4HOtVTsPXPR9RSMKSi+4ZsINNqGS2z5FFL46hIwibztsRoK5K50mKQSWcDUXbbp8AUd3C2hGkLnLgXMNKEmGbTVqU/cwJkzPyLoynvMwxdTQfCOvHHrCw0MVhdhYSnz/M19pr4BnZ9mrlZXbp9O+S/7mRE6Bn5Ziyq2K5/sOXfJVKbvgR8cR66ia90YuFox8O7Ln09iTPgPqJBAr2U2ToXp9C3ijTvj2WcRGjSfqNRbXXE5qPQztWhYf11PoeeuOmI7JnpkahW9xW3jUxWDHR1uk/Iyei6JVxElPhZSEbcWpHkcYGRRx3iiw07CND15Md2GZkEyiRp+QmRD0rSCfsbdHWRkaWW6fWi5i4F0ehreBp+Sx9uW/Isl0d3B8idWx4FWDv8/GwepbFjXP0ZpeP1HeJRYiN+QvjLTL3NjTWT8R/YdXeDxCHtHDJ+D6iXYIHXAbhdFvIK7Jx3ueoh8QeqYMdiNbJhKLkd5Y40tXqY+hWMZqIxavQVSztQ2RGq7ltTY9eiwss6DNBN1aDberbE8mmVv0Q3dPno+j+w6NrFjGk4EjQ8jY6P3EbWVNRr9DYlbON2J2EEWYulZW/J9SOJOHXyXVfyMji0NCg2kS7kGwr5HzfY5+YScmWNEsDLz1t8XyN1KJ+iaME+HFeBUxIk4fldDveB/wB7c+n+owB5TKuXAWN1Zr5/bM40tnfD6DzVoyec5/sbpak+rf7iweV9RLsfwGxdzK7JNJwgpbg9wjLfeEHANqRoRoCqWQXPUxk6YaPu8iOWOCtvkVG0whPgSb0TZ3rwhvVb7hv8Qtsu89zBI80y8Q2ihsxyiw19An9oJUybD6nIRTc+WPNKC0u1lsYX1Rh6hq4E/W2M3E7WaY8FTXKFzfdGXlDMNwGTe22HbtYkgjJyTzC1xHv0FASh1fRkVeu7RI7bkFyqyman7uuh3zhv3tzS8fqHbvKP13PRD1epTtGRq4/XJyixerP3Y+jVKvkS7HUbfqER/wAAu1CuqjgzYOiO96DCeEVkrUE72N5kpaHc1ZGOliwEwNpWzxENPXY/KYycrSNikStFDK0Sjupeg+X7DGb+0O7+4Py/cgjgVnq2DtAEP8o3EnYx337iUx3+wczpM8mQ3to0EWsPBl6ozr1CEW8JFsLv2hlY55jGmfmJ+UaIXeYSeO2oVIQ6ynqNtYdkV62xhjcfiBVSA1PQSBBe1oohGfeYPuPKiJO+F5BsTUjd2gtDr7aYFNMKbY+42IS1dCWSFhk5fsxdtrSXNeC762xn9JjDYprexT+BfF4G0pqCz1aawLdvZmtUp67jUGMjejV+zMZ94KJnbor5OyyR1H7EXGN2L7JLQZNLJN9giTPta8G8p15Zdus3csrUr4EBy2iaS+5hFOwekcyIdBuOUufAiuU3gtNoG+yNAYxm4xjGMRNJ1kcqOUq4vTUcr3UgyeLYRC5GeF+pCo+SP2xsi4DSLQbNo5dDpEHEHhXn8BLtllMH/ZoY/YB2HzDbb3WJaF3l2YGMaQ3cA2bfpG/+gr1SoJuK+pulNWeRixnqLBqi843EUYnMXImYkzsmxbvvh7hBZCjTRdF+o5EIwLYN2N2vvy+vuxv+6K6v5L7l5oULYaC7Q4S9kS0aZdoh0QvrBTRtdB4lkXK8iq1PbXCZLjsl+sdZGSXineOwt5xmpY2GsaEj5QuLc0qfYqb0t6d3HcXJ+VbdLg0Or6MY9Rj6LGuCzl6sq74Cdw0uCGPiD6mVAlQu4kfyz6nCCJ7aajKZ6CZpfg0QnzsORzbMedV9+iXPLIjFxivAw5EvAmsOVlEhKJDA8DZWF47ireHTsiOC7scvoKlSZy6v8h4PZydzLk7OnynBino2n9xkT2v1YhFgRNCeCOCDxMX9n1EwroXORnorIncjqP8AI6JTWC+jLoqayhcYarUmvcRR1VNb6jcFcs+C3OWrgsbF44VPP+j3aE5TcEz1CW/V4tX3NDq9BjGMYxjJMbJgyKe/1CSmrbX0ZxPAQ1puyIVROLsH78Ihas0W+UngT3jI/SIqtBPUL0U17rc5xMmyTEgNcSjkNQKJNKb8P8mYJHMovckYmMUyPYuguj1oX1b+iMi8RUzeJ/QOodPOFGQWj1LbI207uGc26TS58H6jkfH2/Vk0tOEKMrCwFB/1U7yD5NheiolYLPLyNkQzREynuaflfUTdzhctIQ0UnujDYlqjf+g5fgU1FN2h7iboB1XPgS5kyiapo1GkrBr+IyVlwnpsQeqrxND4FQ9AvL7eBEDsaCIlM+wZ8LqxmjofQxsPYsTqFTU8JY98otE6o0y7OPUTQ+nRxotac8FW3K9u1Moo0FHPlZY7LyQ8Gv2ENzSaWL1CXBFOb8o2BmvRNr6n2lQHOB5E83YUhiwjh2fJctyD3Z5FHGwh5moGc2XuLKbVgkDvC9KPE54Z8JI9VAyY8j+qQvP2m8D/AK9zW+HWux09BT9ByOUtTEbjE0HqKpYeaKnRFCyL9DQ5x9qzD3ew3JVF5XkZtiV07qOC8PqJ+5xuV0hxIcSkuCoJauPe+A9xPYpqXWzXqLydbqE77mVGeOSI1jFcjvpLhadZMaGbjGJF2I7utmk+glE1djnjgUTZ4CUsL3n+yf6zP0Gd38lD+xH60fsSP3JHe/AtYPsP1qF/tOEuEGRWNGMCE1tV0dkP0Tap1+n4E29wp3orUUeqZd3JhyvlI1/BSrQchZKV7p79Ru/d9RIk5Vaqh6DsrWqRje/+o4ovGgRqu0EwC6bjbhJAyjqpNtuw3sBS4QMkHzNIy/RwiTrqkwiSnp+ZW5NxRpQX9jceDGDbir3dRCSPAI9o1BSCEIz4HYCVUqfvg2rM+V3M8i7CaPQf6L6i5mdyJeYVseBCG1nhKE95zt7D5fE2T7CjuCfMvhd1c+q3TqaNxavsgpqs8jtgUVEM9aXgbqWOjRduldyhMrZd6I2qMonwN0KjWyizLhjkR6nIFGRAt3UtPKm49RaIRJWsatt4Mx8HxMbmGpW3gM3jwk8LAzIzgly33Kq/JG9VeRTNhSQRzeYa/WDiMluTuZjcMeDUeMZmeSpDXd85U0NYUlQUk4RCHKWlQvqqzdeR8xUyuI/tQvuP+ghkluRrsKgyWZqV4rtmWC79FAX5AL+9uP8Ao7jCaN55L48bbC1/BQhNdORS40sDXcT+zYYr6t4tMbrY+P8AqLlZ3Q5monY3sez6dxhOx+peHz0L3GEwijVx/YsLRaprxp1oKshqwdwgj2uBKY3GNlEVdcnA3+hG3XUevYnSCcUzOzHnmdzwX/AsTgO1ttSyWUWrQ2JGiScNUIpJiivyWY8rDYzsWu6s/CUalj2o0fhjTp7CGQ9sGvYiBydN7XRqK6CgTVS733P9gv8Am6QWtpp7NlbQ1N/+zP2PIYVDKie+oixzfVvLSpi82pzUPOepWZaDAsupZnv9I0rKRGuF2E6q0fUXOzuR3NR3p2Gj2J2p2XSmA1OvuF1ud6Ap7jm06xdV+xqH1UFdngkzDkxqDjdShDXX5EmDfsIci0yjx0asiSKe4zfHSJ2KnNPI0LkLhjJQPKEuw0OTjWRyYVc2GTx7C1meSPWQqYJiXR+Bfun0P1d9Bh1fu8F/zvwY/uDXvdG1An/UsK5ugm9Sy5ktdE0E2Rc78CWjAiSNjRuaMVB+u5GxRL3NWN2BqlJ2CpNgtGtA9bQ1bshC4JoM0cmzsMVQrSKlq6E/Z0d90ruSOZ+8KFjtR8H2JbzGckp6FTsKqfPQY+iU1jdYoolS5NIjUgx6K9hybcwQm7B6IQ3iSDy6O6UhBPalRtb2upg79h6p9oJ0nWhA/rJ8OJ1TCYesJk+ZPjCHphQxPt8/xEv6258H9xBOWX0t+B2ht+oukNnX/EYGbqYn/dEwqPLSTvuJfsnBT2Obo+oom8uEbJUdohoR5S3IwYouSHsajKOoaF9fdiEry4VKYVWDQGNHnA3UR5CzgZA9lZND3e7GMaheGvBZ2GTJJeSiHl7o9jl4csc3Y+NBbskxdnBG1QeOovuSE2Zn3Es9xNDePUTs1ZMXHgSktfyLEReRI77QlOsnH+zP3PImCiJ/h8G9n1EZ/qGYP3Hc9x3X7nl9zz+55PcnH5PD5H2/I3Oj3MHgrqn+Ruwcu/n0mPonONtlN3p94q5fliF1TPj3H2dRE9aMzqy8C6ILELyakIQaOwbRHyKlv6C7EUx16lu0+w9y/wCqG9qK7CMGEVNK3VZqMITBQ6hKbFizyT4AkN3nKlF5b7JSkEhxO4kIfquRon95ZPRs5b9jvPYX+Ia9/g74pcyn1ER3/cZp8jz+52fknD5PF0b/AAj/ADjjQSCbrjl1B9M4PtnF/E+GQrCR5o9UvqEc0FNVokJKxv7CrbUWkeSlMHkUdU7si9iZp7CBK3KRFgRiI1uhg4D3G6z03HHRMMvQ3X6YFRr5BNGhM/X7of2ZoERU1EzUXNREZfp080TOhwkbRv73z/Ck5RU4tRPj5P3HI8/RqxRykEEWPyRPHRpVpH16J+xmaX3FwfJBqBMNW44fQR5h4dBbTDN+CISwnw3RTHoH0NFS9Nfks0Xuf7R/rCVpRGi/cT0Y7k7k78ZbMVG6/bBR6/Y/xiBSKREkZx34DsZ5hUE4xHdaMjW4YZGa1h5Fg1FbSZ2QW5MmBIPkmhil6/kj4sYcGIbyd4c+lUa+eOUHsJlJiiWwFFegdb+AsvIsdh/2tz9zuzQYxCIoxNFGwMiNHNxx9GxH0f1I5PQgJf5Yf7Mnj6nYbhSegzPlncj7g3e7IEp9Gxhsx8dSQWAsBUav4BhdN3Si1E6hfJmqe5dlb0mi6pXc0xremTG2kmvzHO12gQ1PseokRMUkaxhos4EzqaEvCC9DDQHH+3qJWn6eo1J/evyKFXsP8j/uw2f2F/zBvZth4YhbVhNtgUfyEc6vJLf3CYVprBDL0BbVqv3wX3X74EIXm6QTav7hP0csWEuqKPyL8X1PA8TwF0J/wAeHRhjMGwM6ZfyMmem5YrYUfWscjyrWcpZPBD+6riF0mkm2jp+piZuDl5r01ERHmXoTHXU/AqsPXkMX3YapV3u6eMWZkX5z2HTHqhMh6otWO7yEiRN2u5MFK/OF5um5lUHhr2Fgy5+Y05X5GrX3hvsz1GRxaphCSSWIIg2Qf2NCZ+dDw6cBbDYG8FInUsrKn0MXyIDGBPPYBZvbtiYjmZElRr+lkfs3SLiVkGIv1wKGPX/oXIiP8IwfZRis92yqf8QCCCLgfR9D9LIHkahNew5T3hqTrqHhrTgie3FWU9xrANEtP7oOh2TqtgZ1iKK6/ch5pmv6hQNxMpKFjZiOgJsSfbn7xvJd9ieg9RC+XalbllTkoo4eCyzWX5C1klq3IjdXrpgMoOZj2fk+ARBxaDHHql7GtL0HJXLwYPlXyW4tg9mknSWgrvj2tVWR3fsQYL4ay7RDeIl7fA+Ac2btFmM57jXIW0AnatIK1q0JRIcjIvrHw/1fSusGiqez/mxj6GH6D1YHX1vWFzqS7ikaWsG1uNkIeKn2I7HwxryujB5FZEFFQtU+gsg2Oi0+Otek14PGwv6pC30hojU/Ib/KG1cSZ/C/wPKrlEDXuaujKPt00iBO/D3R3h2H7j/0H+of6BHTHmL/AMF8fY/yj/MMXFNDyZjx+rFjUWlots6mSwQeB7P+vRf8WMb6phVYLnAW8XlA7ph+OfqLKgLREHim9nkejqfd4giP4MSTYkPrdjAYM05VS+S3rV9J+hE52HNWOmhjLF999RFm5Fh4Fhr7o1Ys/VqIfgbGPo+l2TW7Rjd0/ULXgtWsUPTe+aF7K/A/1N8HKvyhDZ/KG4b5EdW+r8k9W+n5E9WBjMTHwa3n6kcB9ybskzVDAlOnvXgWkIS7O9ILTNQy1e4gvZPr/JlKXo2MbHXomxlpHLPddCrn5FusIh8H0S3NgMQeUYokKltE9Ww05EfvNUzGpk/DV1sixdiyJs2XuzB8BC+8KITx3oyc0Ep5FT4TXyNj6KhjGPqZeEa4Pj/oQhnpDuSH/UFNfZHMCjy8om41vP1DT97Ie9cVHLXqYFyfh8U9ERmkuwj6L6/yY30JK0XLJHKWyEJ1EajVgahkZyPRuT3K1fzGrK9bU9xD8GZPyml1lWQ4Ue1H6GfYQk4rtB9S5ZoKOHoWhXyotbGjKtXJNzPaZ6V8fBDg+zibxMa98hpJPimuIiYor6CnNaT0Yy18SNfoQnuEGX7mLM/qHwcMbulwcNuj6FviGFaz4fQuCj0/k2fudxrefqGan+zGUbT6GJA+P2MC2+05yZPupKHrgSnsE/YfX+NJ1LRRlHhUki+pBEuCI+1JfKXFSAjV9zTg9zQ3jO7tx0ZJUlh1exj7DtvR8Ci62uGfUVQmvORbSJlGgc6Nxueu1E42FbWfQSrbqlAlth5MmtWz+J4GHhEvnQV5d1qN7sp9iD1h3CRibB50V3pNGtXXA0PvWcLgdayZqakvfRKxzYNx6jD3xI1Opu8mOjELrL9mZATmwwrY0kv3D203rHx+6fpcT39TAkaqdXY1k9gw7UYiRU0olR7Re9DvMd56DxWkcnuHeDf9UpiO5dxrefqP33LGeXG19IcTxfnNRZSGPm7ob8QtugfE1Gl+o1S4LlnfypUEZfWZcyAa7fKqNenNbwaxYw0jAQqvDFVqQ28g4Nbhcig8d4voXpbE9a+mw0Rk1n5KVXyzTECUXpLcO1K7DVMgcWqmosnBvgUTC1PVGBPkSfQ4TNfK9SyuZ03/AGYp+sFjQUN9vZ7NznZjTw0xImov9Mbpoy5drhlL/ZSzSNYg0mSOEdpJuyWWclfgcx5pNcwUqJxq5Q+RrdLPqCnlfYaWHztBsaJ+R6u8i8nZe8lv3E9WeqQg+P70e2CqlC286Qn1cyD1DRj4/wBClL/P9HuNbz9Rjiwy+7L+PEYGxsh6qKnkHcrkdzGblWWhPX4jVKKaHk1268qXwTsDXuxWe2qNG+bRizUTU1WSy+Ow/nA5dHFNU4tf4EzjSib8irDBoSIcC4ZFDd+wHNNTOPqHi1TcMaabX7sjLBfD0EjUZNBM3JcdmGkR3EwKfrI8/ImgpLGp6CaHjYYd4LARrOY7PVGVu11PTwheJ5duxjbvrmO8U3RR46LN9skhIsvSQoj+UzcigVOU/Iw2U1Fj0IJ68MctiGp9a6+dutmFrdDIideQqD4p9SF+UTR/uFNPZjSfcGn9A5e8objC6NNq46TENaKR9Cl6L+XzP1n7nctOVWH3EdPfEkBf2AlhD+gluBzKPXA0SeSk9XchZccDonazI0m4yNlr3bFrI61gTuFSrEB9Mluwc6Ssuz2DrPaR/YK862cb7paiyrI07fkZpXQYyicMCW/QwiTU3sXVymAKSXqeFJyOnVqesLERuWmHkeFJ0zVDpJpV6bx0Mb1VJewjFURF+0YTeJM1gyaKrvhcuV9BJTPaUattkyAVIdIYaQya2xN5bbsMaj99hElJXKe7Hn9llfQTq3kyqIeRwNkb5JVXDX1lhtc2CN6Ijj9hT1Nxk1GMrRHyQ1bRlq9nsYNF7DfD2FnHsDPhpJCxI2mJJ4bWg5T7ne/B5vaVvek0LcV6HKs9xPWJu32YnflNa8aPvP1O58eael6KM+gHGbnUD23qfQFxkNdU70khayG/gjDutg94FbRF2jKUdYw9KW8GiuMFOjuHMpfg5YUKqJtWtKX9jQVjP12N30tc50q3L3byqyLOnx4XHvRILavJAzFF7QxDp7zkGZ3JlWnIk3gxkm2Ow9da6cTRZui9GtCBdGYDxqhlRGm/tuT0dpZkbMQ1ouEEmrUSdG9ys7rr67LPWXgXe+wudoW/2OrXBtPRh5pODIlovV+Ruoe0zvUaNWfaNxcQMqzvLolK2CyzBZXOwmIUQnnpekbZewqUUln9R+h3PgzSQZMiRBewDdbqOOxlba69kJp22NtrwJvNbe7lDOtKYK/ruJSq8WN1CV7pcRCaJCiYqprwn3UZDP3BUuFWXWkKYjFaYrg002k43B2DjGC1HSoQhS1wF6xURjCbRb9U+woML3wkiz4KVcFokaVaWZgaTWhodj0EWgppPcPK6F9wWN1+/AijKd4XMFM1aj8R8E6oNg0jSLokQ+sN/nobMTrFxsNPqz0JGSxcCYVaY7j3O/7xnR3+UZzsPQVA5LDhqn6jV/YRUpWJjCYuif8AD5v6z9Tv0vQS4XbkaCkW0NfM87MwZwHoyYEvYD04PeGSRqbmT2hTWvkRS6lm34HpGMynA814Ya8ifm/UaUEHyh8G46yQx0yNNV7ehNeEeXz6bGtDywy0jTdnc5rIYEJmZgYnJeBuLKdrlbVjJ1WNU3D78dDAypzzhZ0IwBMtMc4Pw0E99aoVty+3kR4LmRuzOkosY0HiP0O1pGAhq0/IqesVCEfVG4Ui+x+Rdar2OOEdU9xK1b0Yj5zTCRW3RLg7MTfyCbs9xK9zsJv7HaxR5dDaiYwhMQn0XT5D6z9Tv0d8DGJTo93wJrdkO+z8Clvi6u8se5Fppp/V5ZDbXc+kGITUnEkM7lUbc9xk2PR58jOZLXwLU32OYiZKRbbOnZGb1EW9EstUuSZKTCWyGkH6EJzrWnWxtaNeGUNOWN0/JOm3EJJqWgaUjm5DPEnpNjHpEPNlS36iLEPN0JXlLsM8yPSd+RcXrwxiluT0NDOFUbMlRmBqtWaAcT1/sgF4TFNfaiOlFSHSCbmJWUeroe0HYk4mERzOXgRgi6Me13e6G4ffhrXtGG4y0aEvwejJ7CnHAVGyORh0fePw9uhXHsUQ9BW0pbeyQpnXqT2GANTWguhaCfRCF0/ccz9zuPPEFmY5bUOYhRsFlQzeW1fQrZYVE89ng0LwxV4H1E+ZYsovIumFrMgnmD1q/I7JqwiG0qVsbwKbXcPcZSvejgxpGPYYKumB1BxciZQS4CnyX3fcW1U5C57mucnvvWg9V7aKIEWo3LcY8xYpf2ZQrerej3IV5g5PMLUTsytWQyC5xNW4naejrTG5lD0kRjGnvyP8pOu25oobO6clUs04EiWLu9GWG1fhEU3If+CV6QVWRGojuKsjyJs8icWHSkNOyG6Y9fJnxj1FaseghLJG89prrJeG8fkhUvQL9h7LL1I6eoYshDgFDWpAyMHG/wBh+bJ9mLTTdx9uI3z8g475c0v1oNbvoNSfhBXp+q5mp+mRYtqE1oTG8A/vaLGEnqztcibTXsNFw0kN+R7ZlKuj6ma1b8iFJN51LojOXkahCXFwxyb+UPETqHDCztWFR1asldQgKXJb5+xE4ItNr25HPA4IRPBIwAUul5FnldZ6IMTDNUTHahZlZWmxWyMWVcirLJ1bzkY2wiyXYYJyxrRIUmXg7RRHmD6hoa6DDhc1Y277F2GmtJa7GvT8iKqnqf2o0SBmwdzvj5Yz2Dt4aMOwky2pzoT3GWxlaLAlGfqN3YGnuaLjxkcshbUi/oi/oSbGjLCcE+4PDNt8iSWLtk/A5TNLSTSo54kIJav0EqhrZIsiEemI+8p8fm6Jw1q+j+RN+hovoOMf0Cju8HivuJuQLzWE1NBJk/ktrjMpo073jWD6of4wM8jBK0CyCfg8BeQvzAnLKM/xBU3LgpbR+pDbnbYJFoNKhdu5rM0rWJ9gdZEuGbg4oolTOJZPRkkqLGRt1QJrdcjEvjgxiT1QexolojMCbp7jZqjuWRMdlwQ7rI+wf3RVUPdYfTMxHI5pvgSZ6mImnqmSDxITSahhPDHxGypcGXoxNuxJMgmls8FNgkegsEzP1E3WjTSGrRQlLI1o5Ku6tSKwkh96IjlG4CTmWauzJhqDFBxEb7hifc4PkrmrMnjWdB5yLEeH0psYtAPDCMa0Xr5ENUfnpfu0J5G2zGjdD7Jy3TKnQvg8Bd7NJUNJ6D7nYH9jJWnhjYq6ndx3EbZy54EBv7m2iXeLbujaqiYaeWNl7zWKgsLSwMrRexISLZjM/JNfHhWxvk/cm934GWarB28DgUquom5gwE7VCOTuldUJcPI9mx/2Q0K14EYURcQWtaNwBHqpcCSb3wMyYp2obANXRdxiySR9jGqoxbRjSVo7iK3FU7Cai3hu8P3I9ng6EsPkZq4Lkdror0HzHsF3HoxrsRq2PKGndSrrEzY4g/2Q+JMfJWNNw+IYNcDezoHAOGigi9GjKzY3DVzi9Cx1B3PCyNBN4PkasfqG5Dat6m1dDsUXdMpnmGpO6HzGxt2SjW85ZBX5C1mvkVKsOyjUNEeByrI0opBlchlPwLpHBKuts1iGU0Empajfr6BJeyG+2hoK/wACWw5G+BFYRpkTY2JJ6B1w3k2GlOwmfgNCfUc2ciU5QaOl9SdMCfgWxlX3MpW+dSqqjWQnSK5Q24RfHyRCBWRbo7sIug1Y+sT8g04Gg1HlhPoFdifcKEHyC9Kn5yJmm3zmEyTVqn/Q7kIbktehSqfKa2H31INxO90bBQbm5fYXY/ce9GBo/BSrwIvVC0VI92SE9zEb2VFWtF7kLU0bDJzIa3sRVQQy2OBajbkdkFtCtDo7kfAghNbCMOHjg5s+DWk3fIpayH6kOa+hCQM3rlsmdXpsS1hnsO8zRMnhjWs2GVbm9MjbgJHfcSvk7zP0oz26OdxzkxyQpVuJOoxDyC5T2EbwP3gSbQ8T0DB9wW8ugl6PoxYouWJrM+AkKnj1Bi2eGbEhZr0RUlg9he5texWCx3IeXoIWD1QdEkKuRqkqHy91luLYts8ajRqankWMtCbLKQ9gUfhCpoJfVD2ZqsEbYzBxYfQk2vuLlI0YY17fIz4+RustTYcYTE/d2HEz9DjR8QcN5aR+AbFaK+DPD9XBevFTVpoxyPSj5DOu4fa9ycGR8i0aTpOwle6PSTuhos5J4EgkjzHkj0kDXliSaHyReKK4L5Ql5J/UTTbGhuwxJtyIkE6ePYezw9jLd0Ss2tDAtF02HDryRN0nyOqL2Y6q5Kq1CgpCvCITdiCOBM+QQ0bwYtYriDN4n1GtWmN2TJHBUzN2MDjO43qxRQbJ+o3B5EjYbw9x2ohHLG5GXXA1bnI3apk2YbJMqZCCU6CBKMSOOP1GEtUuOSWlwUwYckqPuMbMdPYkVuBmx6Mw6fA9ZG/0O+ums/kV29ypyLvI5RjseoxyRHsPQTsPsYvIsx4H4MOwhPKNePc+axH2JEbE5SNPYaSonGyzGnR6ZOAW8KmH2AkIaMllNilhHZ3JDW2VbUlfIlbqU2imMlT2FGuH0I3DGgqYngbs0sGYJta+RzZekFbCdyt1vHArj1eELtjvPCIPJ1uQQkVrL74zCvN7CKU0hNdf2I2S7ss2swVbUn3YpTyLkpfoZm6i3ImvohmeWT7iGqEvO01KxSLjhSGOew0LTF1eR4GxjRvufcUxea4SsEaW1svgOR3dB90H3BWsLGg49vR8DnsXs/k8h5+hjsKC8nsyz8C9mRdclGi1P0hPYWdiSBC1oyMyXsJ8lR4Bu4NcS8Gpv8o33S2tNC5PtSpP0NMu4/CxxtK3zCtWj0qL3HNVmWTnYJ1Vujx5wcZXHkyx2Gmo4Rp6lkdU++WZ1tZ0a0LWzwZj3moK7iWJRdxNw1rqOYKtYUsl3IeL01RJuhGk9e2BGZK1008i936A9Ola3JSa1CKOWaOml6kxKsexDWOC9tynqKbrUWwcb7EKOasIKtpH6lRi41EpfRMJC2cHLCGx3ovqhc8LtEujNi0XoiBizDvFfZr0EnCrRp9B8RlLV7GXyH2DDchnllfJS4EPWRyIno+r4GrUvnoiPISV49h0sokqwPj78jcveEL44vBGBwiywiga1pQXbYxnYMENOtK/QKKyS2BMT5H4C5RG0tHLCQ6yZr3g03AWMEm1cQQzA9U1FChsiLF2TgQs3oN5nwXOmmuDVy3CjG+pH2gjPk77CmgmnYz8a1wvkwWjj6SzjdC0vnkY4P0osRptPOiJG4aHqY4f8B4D8GfvJfca92R9uhFd0TuPlkngnc8kLsZmVpAmW79hdpjZ6qI8DyHWjG/I9qEQZHlEmU36F9HBI1GBnv1LOiDw/no0nqN5on3Q32GyoxyUr5MjcwWMDNzfgbpw2uyDVXAI2myi0s1lFZgU9VrdhK2uXFGds+wwnSokqNnwJfqNuBs3zG3Kf7SXkLMlfYS6HdMjNJ5LisPwIXl6MC2seh6jSXctTLYxNGGOE084RWHu0/yOmO0rMo2ymdCkfUvF1O6jxssRumMtRZyqUuSimXdRGzE3Yre3sWcCBXsF2U9SF2HoHdwvVBcfmdro27HkG05G53IVorRxoK1qhJN5E2tfgqcni6C3UZne+TzE7cm25E9x96GaI+4/3Ah4GR28iENd2TYWuxkNUd2DBENmCDxgu7lOYW11KLVbRLTCHcBPG2hHMlqsav8AZWT5q5L2MqQS0THjBlGY7MpbsTuJN/DgajWS1kRNwrWvuOZi9iOlwNoPkJ9ijicJeBO0rkFGzQmE04ZeRE9J7iT/AEJtnTO6RM/aYT1aNdjGuwaX9DXEhnaF8I8TPWEFIELKGuyJwIufkfcUTs+r1C7maNRYxJQa8F7j9LM8pjo2+/QQVwZMh2MHxZ3ho8iTIt2Iu4kuTdCmUK2Yo3L7DfMNf9E6q8oY1b6GWzb3wNGu5pXYKdKYE7ooorsNNB3glbM5BTmCexnYRlqfUV/sEr1Pc7y9jKw68Mnd16GG5eoz5Vyz0DS3+8a4wToHEJNtMcniPy6E7jqErRi7DK4JEl2Ej6tW4fiF4PBDTgYdxs0ZK0fuN9miH9FTU9BHBe4bOLCkxNng0Y5ZgmdTQ9CDvToPZ6KVlED4E7nse/uerM8sbf6h+oXYNluxObppdxzqWGm1SP/aAAwDAQACAAMAAAAQ95UNTtFoV3vf47FxJ4ltJBFJ9hxtdlwYo8xFNNNRlohZXBhARd6nI/R5lFuUgt9BR1upht57B9tx91dk9pCCRBBUZsV939x9dRpUvjIyoXb77Ddt/B9FN99to4d5NJBQEdV44DbZsDA4pFz/AP8AMc/dcX0kk03zn3u3nF06NEpSofYd/PyePV9/u8pkPMtP3H2FnHCR34eL2+SROjELBxbGHwGt5msf8ttd8MEH91308N33D+3R06OKP7hcfuOVicicJANf/wBzd9JBC8pIQsH5Jh3hTMKzPMGnnDDBAzrnFrfT0I7xYU3HNLlZBBRxRm7VLbjlg9xYEgXdlZUfvhDT1BDPO8+IVaPfZ0hRjPjYvApOPH5hJE1UITvZ5lhxYyyz5wUtExYflRFdH8+pVH7JeY5plpxBIrxJVBSBeVBqhB1dGaaS07Y91TZtJdxFxpZ5VZp/lNF9uftOuF0RoDc2yewoRFJlkUXQY9XYeKpOVNaZqx7y/wDTnQaaM9jmuiYQQTRdE1XG8VtVVyZC3FfbMjFrkxNOYfH2xktNmceRISbzTkomLb6HG7sxkLzAFikJl+jWr4KWuEfMENd1Uj34NzGnLHNfYKrEM+vo/pM0q0S4jm4eL1bqztWoTxdn+cvQSq8O6g8wv4qzPISAqgSqqk71zi9fjjtoLmz4sVfLOEMDQKykmtyjy5lcThU4XifB9XXx5oW8LLNzZrV5sFzh5ropL8ze1/v7FROu3vo+1BhMQVfD2EDdRsd+cihGvrjEa9/mOJMcYRLcujErGSz8bc7YVfZWx2soAGGHLGB781ZCC/pWNTy5eVsDdoXx2TdabMGeMurV3bCsqTPVvzvjX0KXfaXW+PcQRkqXQ0f/AGPPGwbRhrrtYYcMC2LijnEpB8EABTKJ69f4xAiVnoEvz7WTADNN7sQCchS7aYSVCns9+q/2upwSXl8TyiNPmVTom7BbI1/hwvgSf2ccTGPLoa8aHH3RFoEF/Rxlds9v9dFtRdcaB5l+tR20DeOBJyI/oWRPIvkxClhaxA9R1vw905NTRtt62RE5jX/j6KGPqPAsyAE76Qq3cvT/AIUk3qSn4I5PUd1nNYsLnQ0Ah9s3vxTLQMhrgfuoLKOeXPNhZOfPM0z4sSVh4EtxjHu+IHAPlvq3MPQp9EUuIim1hSoC9OOVoEFL9AZ54CiXKZUZ0VU9ta7vNJpjMSXigEffB9dvM3pwlXXYlxHKr4Vp3iRJhRNEMotZZXfF9kwYkni9zCRP8pjaS8czRyHJlJjt7RBRLJJHvVhVHZbRFvHC4sEoRZ26Vy/RD6T1a2E9JlhhthJJN5JBIat40+LVKify05TmiLkOxVuHuLfm1oelPBh1hhKY7a0wKfY/gSGKp9KDzNfEea+OG0ldGXkce8GRoAqIEMfgCi8fegd/Acdfe8CiB+ggCgdiih88g8Agcg+A/8QAKBEAAwACAgICAgEFAQEAAAAAAAERECEgMUFRMGFxkYFAobHB8NHh/9oACAEDAQE/EMXgmUvBK8ZwTr+GEIT4FypcJzYiSBstrklRAa/o1lid4XEnH0bI8I2XOYWxvbH4Bu/KuCU5JFvsNjY0SZTMoNZob0SW7Gf0BP4FhmnUNDxCY2JM0GPrnXfkp+Ik9C9WGiqY3fQpexNJRD3hHApEhy0hNsTs+gavBPjnw3KbRYir9FOz8hMuhq7ERkkNt2KSRIkKeB+gb9Cr4KQaJilOs3CV0LdjwkMN2UMQuwNvA2nfFP4KXhcdkDE4oZ0G7KJl4dIJGJClKJTNIIIGKVlxRNlXkuKRMnGlKUuKUpSlKVmxEIQnOTFaEIX3l5pSlLhInCYhOb5QZ0awquhPDw+M4pfK+MGqSYZ2LvDw/hmKQjI/Q6uyEEq4S2bI9iGglVEwZ9ovNjXgWZwXeHh8FyLCNojRFH1wnm4xIra2JFL1iTR5IbVRG9POxd4eHwS4JCymT0U6ya474jqrCPQTp+CKPwN+xEqxSYexZeIyihZKKVofkHEJDQx1pl7URCQj8CTFC2CWwnEVqgsbvxP8jiaxnZ9ELMfzxW8N4R4wlijNNBX+Av8ARF/kSFKKm2NJ4F6TXoeinkHu2Nuhtp9iKbKVibY2i/kv2XENi7EQ6Nd5mYdxBG/T/RRVnY1Z4O7GXsa9CYhkDzAUIIsGaZQZYxoj9lL98F2IaRAiKUomUpRQ8iJDTCVs2CRfwf8AnHn7ndep/ZE1g6VCTCS4JR2F0JKezqfs/k/kv3lZeVhCwsxGizo79DpAR7QT+l/v/wCH/wBQFzdoWIqGz7wPsFp2Ol9BdH7P2U2bNieGMeFlCzM0/YF4L5pr8jksQhoe/n/1xcdFw2sfg39kJhd5eITC2ITRUUpRjFv5iFD70sVk8Cs9CtU94syuy5UF55JJIwlSfI0IIIEgl9kFo2Kd4JoreS9BaRyDCpP0NPS/ple0/ueFDoOyxuihO3Bs2+CRCEIQhMIhPZRt7GmsYlrYkphoekbNo007O+LXwQ2xr6I9Gy0VRJn0ekTolWjfkTGr/ES+hKQJXj4bBmdKUNCxsfgaEdwfZMQRMpvwX2KHgqLKLYk/LgioJ+jZE4Q36I/Q0zotKhkUnsTWghJCa0O2Go5m8UdxJEQ0iCpDoH0/Y6x/2y4dSMnsRHFsUbor8sSVbeoJeUxueyqDrbQ3O6JBP1kaiTiEjZ2cJdITlFC9Fh9x9mQa1BkrZp9LZcq/6iMpLZX/AAS2JNrehdpv0NsHbbqNuhiV1QgJtaREmx2oVA7yNymkeh+VD4LQnKKF7YldLFRGRj6OwsQshtdoi7ErpCtZU/OxjcN9LQx3XQ35Y17G8ngX0OfSED+MVmxKyEINFFcGwt8juE2NxXFOj6ICfgutltHYktEKk6PUoiUVLs6R9jSKjSaTYkJWN3k2WUPXZK2JPLJJItHlH5jYOoTJ3meoq2i1pnQr0MVLXcOwiddFNjJOiS+D0JrZj0+hCpFawTtDsCwY+ylKOCtq0+8+3C3+Zt4KusSf0V6HKQeOjT0OPyIBBRDBLK6LEyUQx9mnYhEEdJUe29CJ7OE2avnCDITmloiIGno+giIREDUgaibD69it9iVdCUrPCgzs83CGxDfwUpSitKlzSlKUuYIqJhts/wCmWGW+TeFKXERTwUPQx+rH4B+kau0R/MlcFrXGlLi4JlwsUpeMo2eBswP0YwafB9Q0+SULNZWPFLwQhMpSlJ8CZUUeGzwN3jC18M+rO+/jeSEQhCF4eBMLfJv4Xin/xAAlEQADAAICAwADAAMBAQAAAAAAAREQITFBIFFhMHGRgbHR8ED/2gAIAQIBAT8Qa8GieEIQbSViae15pDX/AMT8X5NVRno40OjL4pwded/G/FKjU8uEKornKF6d/gbS5OZZ1Js2EcPKlzfN+ZVOiAkJkKsVEEOENcDZLMWH+FfhaxM1FRBBNYJ+BsY0FQSjgvikpX+V0NfA6Y7TGuaN/bH7sOwaFIlE4IfGPpKNAu9Cf2LgIJp8fhWEImIQnhBoaManuYfqUzoTnUJ0LQVNCVdEekfof4liXwxKC7GK9+MzDYvYvhKTwbWzNO69jfLOsOBEiFjuWCTDweYTxhPCeEJBMJPF4RzEgmITPKIXshQ6PBu4hCMorJBYavAxWING1hS+MIQhPAQhMa8KUvlf8iZExqjHxhZSIQnnSlKX8K8eROFuEafI1fBeN8H+ZeL3i4Q/BfiZSlRB9hI+ClJKitkWlgZVIUHJUP4Y37RLllpIUVKQ6yhfgYw8LToPYgSMSzchbt0JsSS4wbrEUaB+sVF7Oeb9IJvF1lC8H4vkYYvKtDcbG7jgQvhdQUkxuDHMbf7v/Rahf5Imz+EL4dYRYQsUDQ/Qfqht6IBVwx3sdNwahPZbqR0QfTYkhVia1scGx+4ToaMv9t/6HWYqly6KL9CX0T5i/Tk4HxjZYeWPCppRxf5P/ZWCMQziFPdKfLEppjSuBVAlOCmtoS9MOI09ERF6FR/CfCGyih0M4j0PweNUEbhe3+2RBtpRuTOzoM5guZi3gZOChaV2xJ6GxxETQ0osqsf4Qnw/p/cPjCdcCd2VkwYdEZH7Iyexw1N1Ow0hYHf6v/Bh/wDT/htpNnIo9Gyw7AkRzhcY+TuhT+GifCY2NOD5ySJlj8a/Zv2PsGF6AjMzXyjoj4HwPkJU9CWDUQu2DZ9Ds/hCEGjQ0mh84QvFsbKXCEQXk02xL0xL6eBdrMEcfHP0fw/hVi/+h14Fl4aGmNMjEmJMSxyZwHbIe1G0PWvBCXXgKPBJGNYm4nSiJAgsv0X6PgN1ysVehobH6oamwstiPQvUfIYJ7WJMcPoNFsS7IpSjaLhsb8hryPiPqEzsadDelEltjRw2bVcD+D9BMuRMmhN7E67Ej2yG6NXY+GnBJlBlMW/Z9C+xZz4MbKUo09nvVnSgiqUP1gtlmhBEEYKXyaT5I9FeipXoZ/E2QppYkfsevDdjEH6j60OdHtRGhaOPYti0Q7Y7cldDps1RfEcOXhZZqKUrKGNR9xkqfoh/+Ohd40b9DvJGEi2iv0VCSaKW6OPkbnBFWo2aPJSC6Id6EOLCIOJVkPA2jUY/QfMr1jU1Q5ukJb0EWMfsJb0yTgdrkhOjN6ooSCj4Q9MsDdGt0lWi7RD9HvRbcHzISl5FJcYQx+hqSewnoQlWfQ+xHsq9jbOH8JnVifTIS0OCS5RyNNMappyP0EPQNtKpEoLcBc4aIcWLCBtk+Cyjho/Eozk6CV0sWozoJJUyNsij9CTRt7XJs4HtwUlQt8iYe4z6ipguacEsgTukJxBvSHgGu2+jrYIqFMqLcIfhwnJD0NxbNtoTZX2hpNDaYmkj1Gi0N7oVmh0WsbwjfA+ds4zDjQ9bOpExBWJR6cnyPhhW3PBa7NO1h+uBzgW8CrTRIM9DN0VLEYqR0MfDG10VyCrQ3lejQ7Db2JNgkpSIhCZWKUuGyEJ4CmExLs+xSsoTiJKEw18BEUCuByjGtEdjiUiRPxz8DJosLKgmEIzZMRjTFtVjgUXwhCEITE8YQSxB6ms6ykQg0whDYm0JPYlC7kI7Qu4TOxM7L+Zoqxuu4mIQgiEIGhoY8QmH4JkJPYldiQL2Qu0TuxP4Ykfkhb+cIQmEGhjRCEN4vlCEymxK4YldiJdyI7QrTzWFiYPwPCKPKVGkhYfgkP8AAhEP/8QAKBABAAICAQMDBQEBAQEAAAAAAQARITFBUWFxgZGhELHB0fDh8SAw/9oACAEBAAE/EHrI9k7Ec9S3iURDKiXExuVExK+qomf/ADUr/wA7fQa+g3B+g8fQal/Qal3Mw9o9FwuwXr9RNTKXGSPD6GLmMuL9DaLFuLLi/S/ov/lKgguJ9ATyRIkSVEo+lRMTP0S5RD/0cOomL9Yy6FiXBxBuD9Bg1Bzn6DUtLlxwc3JwTXGw6QuswvxNVrZWPey0fOOXM8mebDu+j0fRcWd0WXFl/RWLF+ixb+i/+FHmO5tNvoETpEidInWMSVE6fWokplMqJiV9GKBdGw5ISNlp2eHiWHtdeHTAlh4QpINa+grgkHpBxLly36MIuBuIwwKDVTqdWFdR30iREQLXF812lJZH6D1R86+plDr+gcSydkXrLJc+Iv0uLf0WOZiL0+qy/qMMY7YxKiRiRMROn/0LGPcMZ/WAfIwkZhMMDA8MuV7HD05lpRwmxxUHO4MqS0Is+iyMNtRp3EOhCmvoemMMsMXLmEIMp6Jd0HoBczX+nG/BuP1W/ov0Yr9FqOfqt/Ri/wDgL0+j9aRJUSMuY8WppG4Z1K/819HUXEMvTWMOwrEOkJN4m6MuDjiYuuG7N+0GWww+p4/S2nlHL6HLMUaI9X0LNzyiy2eULIXl4g49t6+7Fogchb3wRHcMmsHoUS1cdaB4OfWMFnmHEuL9Fj9F+q39X6s9UXp9MzMz9F+j9R5S0oPAREO+sS1AM537wLBpAsf/AEkSPeZC/CwLLHjuQwFsJcuWu4RG3yH/AJBcc/RcRfM9Ucoty2X9EBup7nC176le9FL8R+4GPR1/EZ+ZgkuuT33HdrLfB8mB7sGNx0cD0gy3/wAL9V+r9XX1XP1WXLly44r/AMMYk1bdI/Z4lMB1AB94njmgwte0MTokAMqV/wCSRLiVE6TKHC9yGWPFy13O/MTmcKxW8nabEs6n1uov0WXn6LUqDvQLGC+rfgJhvbgHvuUa08N/dgBRgOkCt10OWIIfkmKFGDnwEsGs6XuP6+sNfV1/4d/V/wDC/Ra+i19WXLl//BLlRKiXKjmeUr6V9HEqVEuKZyaTtOs6hl/Ms5jxuLn6aMLLBmwIlfR1MuDLD8U84l9NHYRoavrnAqAdAqHTMwqgDLUzgt6oLMbWWgo5LPocesUszlLWG/oXENQYtRb+rp+lxfotS/pcv6L/APE/+NSiIVE+hhipSJKiX9FCXpFKfQNwy/QkSUbEuWdPaIcw8ZgMo+UYoB4lUzaDGIxzKRquqLovAl4R1+Prz6S2xmjQeCJ9BDX0mv8AzUx8QSyD3d6QpRB7QIzA6v1X6LFixYN/QHpA+lMplMplSmBj/wA+8foJE6yolzHWIOp6otcC9IPr0FFen5/qGdR6okpF9ZftKCHjDCPjPT9bzhBlC/BMuosZNTL0+CGUuhs9ek+2DHz1iY/8KLH0jmvrcuWDc1xtgmHNm4xpBExnysIHQmGc/V1LlxYuYuYQJTCxMJT9PqlJSUTu1OIjkDHQZrMHeeqAJ8yxZuryT8zNivrf4lX6v7hN+r/mX/s4c2N4MMmN8IQ4PSWBPPLLyx2Zex7Z4Twlq1F8x6Y1gjE6IBxLqlstykLGLlB7KNHeEvmY2PtdRByLNxn1mHq+juXX0Nw39BqWy/qtxj3lH1sl/RYwvSWcxYMECH0CsvLy8vLy8cswinSeEKaU9YHp+sDbGU8j3nUUt6PSPGPrKjoeGGuPCmmT2Ayy9jSKf7PcmgelGRchdVC3EG/Rt4h5QK1M7RAGp0zDLcT6XJCY+nWKEIoidEucx3NB+JaWHVSM3XcIMX2Jv2muB2PzUtqVclj4jisu5UzqViVE6f8Ah1H6ljF6RYsuLUYuE/RYxMQz+teXlpaK+ozeYfU9H0VKxUpNXL6ovJIq/on1U7S71NNw7zCICWE8ED6RWiBWpkcSriXHtGGaDdjUQ4/n0mn3L/UTg9ZRHB6s0R+VfzLMZu9/uKGfaf3BUXd1p/c22z1ixzQPm4svFzqEfiA4V3vzcfnsQfpPktH9pbUXqTPfUuxEcE8kZcXmL0ixaixhy3FjaL1Z5RUEVOSITMAwXNQ7Z4y/12vE8Y9seyNJ5I06z1T1TDUr6K7fQ9UcuY88xNSsJ4tH9CDHQgDBOqgnMK4t5hhkXOcL7QEsDRk+IDC9oYFwYPgj1qYcShi2w9poTN3ZTr55/Gx4vYYhgP48x60/+XnbPTPF9Ep/aCXv6v1Ov70W/flLL+uL2vqim39f7jye5i7F8txS4sYWLFqLmPumDmMPlE9Z1Z3IKqZRgzZMMxe8MKE5yAMCzwnhHtjhqOep2owATxcSWg6OZWrF0y3JHHUa8SpUr6AuJjZotWLlI64HnrKzDFG9uhPAd2f5MQJlzHdlwW8CIuo7rFDZcsBLByNSqMfUwzrr0cMBgBAZaVWHEwLKnoyplGswazPCIv8A9hYsWXFmCK1FjlKRpt+hymSPRMG498e+Cx14iNqzowVLvslY1+sYDPuSnYPSHlOJoIUykp0jk4mDKNsh1YRgmPRj94GnAHpHtmWPbH/xDhLC46BFuz5sfiX1c7CiBro91cDRwcEDuPaGNfllhfOmo5RhPoJU0DAVbaABa+YLlWbiAMModYYPU/dyvpVxIkcpfFbYBtt4ZhySPszzC3EX6D2fQCUSwYrmLjP0OTLi1HKZI5do5RyYnWZRq6kS49kJKqBd5u0Thp8w7Btd8SotToyhC4wsowUpIDhLElER0ieCPbMusQM4g24nZlTMzEYC/s8w+lvwRzHrsE+wRO5jqzsnqikjFROsco/QMOEUtp24jYlO5CsB7kaIrwQfmOPW83af9hhmUiRmn0EBHI2SrObpb94s49tId8/QtRZjl9QsYovEWMXA2SF3JZCx0VmFss10GZFN4ImwoOtxOUeQieC+IuoUaUxRxHKt0Cn5iWG+piL+GNn+dkTxMEIoTah23BO47Rizj5lZekr8D3nN/MVplWpZ1jGprGflGLMSukdR3GJE+jWKvUWupuY6qisimaRIDYJEcEScfQyQKhlaR6mJiWn2ZTSFt8D9SxSosRSsR+jO6MLyEytx3gAkvVxtATfQYAWoaa3UarU+Q+DmECsKWsdqHkuL6PAi3PotQbn9US7z5blTQRsdDTqiE7gqurgthY0OuSq8QaKBxeHvArUQwWEj1JhRHB9zJ7zNtDTavse7F6onED9H8QLN6TT8zKIHqYghRe0L5zvHxluyAapnIR0YLBu6VCldIwBvvKuhCsJBNSruDxU8H1Cn1dNy7i9ElxlkaJZGsCiGCZJdCkL2SjQETwVE4uLce8SJHCxDaErRHVYORDdURJLKNYUSo7oqKMnqCcAfKsV6fBFHHwJkRULge0wQqqC0Vb+kM3nrMyu7Vn+Qbum+sT0iu3r2j8Ro35QRO2Lm6IN2D1jKXoVzZvtABemM5l4ww4Fdv8zuFZhkrmXw9KhGlB2nSWrV1xLGy6BRfMNAAuDrCKAeT7RGOjAp0/1jCxFXx7MukDs18S0F0D9ynQ/2C3wkCbvQP66M/tGTW3pE0HQNTNIF5wi8D2cRNEDrWIPWG3cG7we0DVQ+ZnLXvYlaFzvLQLUu5ndhfmVeZSBeYHWAqA4+jX6CUcMu4obiDkPWDjYathhanSZuGaE8KcFPSovL6iJcPyssC4LyekR4VwCiVM1y6RxS8lKbZTkvzABOKlUJ4jG1vmiHpc8MwwaqLu8h4ioSN1bKu30I6CroCDNhdPygJobKcbiFYDxmUOrG8k9KmolDlKuBehqsBexFGO19Uax7/pBbQe0QI0dJQiqG1cAEzVHMIEJSy6SaCgNAS8ZEiHtxcaybowdhwRtmNZYBVjeZVhf3jwPo/hh4mixPMwr024fGoDfYnD+ot/dFj+I+aa/C2faWX3k+QfRIhKa0P3sPox2q46Kvw6l+7dSGtJOjiONhLeIwbIoqHbiOHcdSBgMohuL3EZ9J3YPRA2nsrlz7QsLsL8KdNPYnQXrDCkMWq56TU9mzK8FbxgwvCp1VGRdxtiAjLA9DsQ1W4G6qMpabhsKEVlWrdH6XpL8RunhkcSwuUz4OY0IQp3PbpE6Qa4Zn2JQhHBzK/VGRTd59O8xjhKyqAhDJfEbYoHdbfWbQFEda5gTGx941FvoNUfv1m47Sxt2xQO8QsECgQtVVeHmBVqq8swkomTTrUKFFgFWAd3tEZo9osgrC8lXKSy2SzcQHGLYPhxk8SzJaUYB5csGtAl0BBi0PNKB48yrseXRDeEdIjEqYs1YeT8y7A0GBd91mgEtj7gagGvuoF+yfwzEJQWJvLHCuvOE2rnRxHYPU2Ru0X0K+0S4zoP5It14+Eb4D1PuWfEWvzX2mV8RqybGw98j7wuAlXtRx1YHoEGxvqcQx3L9TdiC3ZH4pbCXHOpOwBjZROgpK7Gx5VkI2I60Vc9XUK7QLzEDbE1jboRTql9m567As4WxyeYUkXhTrrDEFm8mPWOQ4SsH4hsBrlC6meIqzX2+qywI8RNi3hVa8XHaxQIcxyZE6YYTpjpg9uupSLWLK+hNuZVXrf6mwqkicKB0FEyQAXYXLRq0UGT3PSVbrEG0MEF8ypPAYYAljiHT5rLAKgHCiiE0sDnLMt+6MxJh5/EqJQLhW9H8Q0QCK2dwvEpGDERdU61CacdFjWVUX3D9yLIs4y3C6AKuAjVXh1KQSg2MsVQeQz6XqYIpK6QNlWx2JeHGMuY8LuqqlvvM+DTVmmGAKc8i72ZgIWT6zsPRjRMKLx3ZTKTuFTZ8sfknSns3BtH3Vn9y5heK8yxYnoQ1RfVKYeF9ALP3DZQer4hRWECDFREpxbklqoqygcMIY9SvEu2HpGqbvoFpuV5iqI5uDUSyoGLPMAMLQathu4VEc4Hhyl+aZWku3R06TDbhsuIa7O8Bfl5lga5KhmJEst32jbOG+Eiq25YUFNuhrfI8xIWYyjfeuI1TbS+0ACqLeOIYYbZQa9memjiUXQOgi+04K9UWnjrfEWO4ckEAIOVqLops8Si0quxU7kBdnUnEaJU7AC/aFCuMxvu3ds95dxbW44rT5qJBUqLUDCvBLKml6cS9LA8UmCIBtLVoPMFIYL5KlBKA2nWIB87D7Xe4Uh6Jd/eI1lRbHMyCFqt1BgOZkODmitxK8/LapfbEpW4qlPWBSTobxFzYN8DyxV3FfA/u0DKqRKRMMsZQ4TKNfoBhg9wZVtP0a+8vuVAfdjgoe4fqcw7xcWWHYNzDs9E/corDtBMlfRajYeZLJjVXLCh7BxL2jVkCbdCsWSog25QS8tYrErYKJuhdJrDrCuCrea5ljCoekqOF5zDguBtsr3ekWgZdEM62FuNeZRag5rX2xGBQHUKuNaJTC6WLZCmzxAaQdWmVgA8j7CYgbuVRLGSUNeYqqpV5YLyQ8P3I1pdVL0gsbekrEtVi0UKvtqYPXrZdxLbdyhCrWstTcbDNuGKoijVmoGgDoqX5wzMpXqYO7lS2MsJ0OMtyyxkq6G7reutekJUQWNV8TLgLhvipWKazxC7c1vtGHQLpqDQ0DoxCIGd0MSoZR2WX2l+neTh9KiiwbZqtxJVszy5L9o4oO4aZ92GaIZ0tlBUmpG67Y8xQtVG6RgZtuq+zsjJtsyqAegQF1AVsOLVb0jpZbrFNALsS/YlLOHvmDZDwP7jU7KLx3ZdaPuD9Tiy++Zm2L2v8AccMeSJVU8oqD877/AOS9dTs3NE11CmGxo2mHboCNNgHeaKjOeRDVG65wme0wWtQlQT70yJwrBLBfYL8wVUYTF8uiBGhE4ZgJsjminqr94I3uuIGadxQFKmy7VBDY5nK3uEm6AvVwJWELq1S9gdEuPgBXlMnr/bggY7ESbMqwwysNALgta4lQdOQN9c34lAtQvCkgLdCoX6Th5OXHSKS2AvvRdTjBw6m95OscyjrNPXzCELHDTtHQqtAF7qJsN983KZ9+v9jW2r1gol+G0BTn09ZQ5MqsR0oolIQ/xPsBC3/VdpcVPsj5zFBg8j9ygsum0Y7d4l8xGRF8X8w26zpT+ZZXBss+wxuL4oQcUXhjQr0Moc98wWAM7C3ZAdA5cTrVdmUOGYAb7RaZfqgl+Qa/eCyYmRr+7M8imlD8Mt/Yv4hd04EZ46QSW/dLC/RGVoBWvXpHV6TccVj+6zcrejibje59pZou4MxYjuIptJ7XX3mIHcLIKlnqR1eoJKeATTdZipyVFgoPlcdpW8GGHcMGIK9WAqi9C6uUC3bTn8QFDewuLS7xgFuULNdUx5gIp0aslSLSrRtfMAl+pZTuRRqthkqi77kC6uQjdHl1m6zLAxKQidFlZhWiIXhay1ZlpRhttas03aJzBnk+C/tGlqq8xNiDDlZA0d6Uv4mNOsYWx0ZZuh8hXzH+Qkyn5KEiJ6hwdfMNcGareozA23j+1dPxC/L5ASzfwXWICW1Dxu5gjB4XT7QJXgYr+FIgwTwSLRhOaH4gGSBRk5z3iyjlsGjuw+OaLVcZaW67x658ythpjw2gHkSMr4feqsUZYxRu3WI1VSkhuLZM3C64VlvUugqLgx6QGD84Jszh/GC6F6M4nsfRPEFtuFIKtj4uXDR71LhBRo7vSIYpeuY1xZX3c74+0t36JuHUJ7P3B8veanUfv/kM0z2bgBGKpapgL4q6atezmZGQVVqad1t+Jdbcdo8w2wVuUyiiIgfniAVSrYhqqMRWFi6RCwI94xwvRlA94LbBa3RLG8DnjMrVzVOD/sxG8Wh9zcBgTtga8Q4Lo6wWd1yCdunrMFWQ6eSCUFchWOkRULwsFgWjykKikjdFe9w9AjnI+4MACAsHeWl5MwHnmVBbpQS/AEF4XqAvlksXVQRyURaKP3I1r5w86bb5yJuT5iUr9twvzg3n2R5t5LJ2Izf7DB3A+YnHyY8IIJVaSzoELU5w5Jk7QJTQr59oS5t5Ytm1aGTA4ie1ohFIhSrEcVXBrFSYC81e5ZgboV6sRCmgS9U7SjiI/ZQAAXUneKdq9IWgjLkLiUSNE2SnQRs0SjcY+ygPd295073iFqBRnl6TDPUH7lSnXayX7VznJ6F/uWWnxQXAPcfqF+T3lXIeFqWwMOeYcweK3INJzV7jrrG2aME2Y+YU6nMeZynCGzC3MwIumkuUkrWAv7tS4HjcvctL14lw8BXPtUIyN8qLIi0VVGkcFj6twyhYW1mAAbB3LDd2AWsItcstGsPpL7O0uGYLirpyxvaCvyRVW+lOYqrLTi8fQZKw/cJW3EM6BizLaC3V/NzEWClqt7vEqtYuAK6EKooIQwKNLZpAWJzBVogA1AnEuOr7RKCrmHw2sx1AVEWeKhEv4uUpFSnKvtHWH3ah2rzV6jViyALL8mV/zeM4Fuc/mKEEAsCBgHdznH0FNm6bS9Xf6kwekKXxxdCW2YE0vlL04FInJVZvClxuLopThoq8UVdc/mVH4W0Ciu595Un3iti7HhHtCryWXTsjP7dJyNMt/fUUtY15Y41tdT9yzFHeq+0bOX6Ms4OypOmXZuWoR7n7m4e8nPn4/UFUSrg8zkXnGxTWOZfnYFwLGdNaQU7vvHU5TQl+TZlV1EueCsgfabwoWlTKjXfpEXOwbG+uYCDL03KULyxcQze5yHWCoTGi9wFhT4fPEFUBxzbXetEw7jUOa8SpGULFi938QEKrgiLpuidbq+kwTV6ySgRee99qgQFVd7Ra6HatqM1TwHWH1KVKTlGzHqfuBRD4Px/QSlEGxc4qFQAAZR2QU6mdJMnRLp1+ElVimf3diaLOYlcMOSyGoLR2n8XrPT4xBMlzEGq71FzqUQ+YCORxV2X1Kl5keyv2jF7grTY057MDYgKrFYTVwcKxKHeBT2p2cthK5MP1BDK1FLUN2VVfMtSUaFWi+ly759MQtMTPYekMSwSuMlNcYr46TUBKyq7n2YWa4/CnI2hw+e7BJiBryznjUzcD6S1TPzOefCVbhF7T0I90r0qYprr/ANjxWMaYlZA5VZlvOKiHgH0oN0bM77Sl41xHU5fSas7wFA1Waai7Sx6HH3YGlkKhsGgKGTepvGsh1ll3q1xv7lwFS0ukXuuY4JnjItMxHQzWWMw0M7yT5CGUWSzp1gdG6rJ63AplRyrV6suIKpvGezFCD/RufPQWo+INPoTN+k0dIMH81EJG8omI6xS37yzwHwiG+3sQ1KyFSqgWqPMwGViN5VkmLeifBDuRqGmCCJxac1PmpWvSczeLxjMRHi1vg9oX7gOv8wGphT5gT6usJDpjC4MdKu5gpjIsFC0uF9pZIRAK/wCBE4RQUUVb23HGy7CyCyIiTiLairl+T/miaVWZ6CMqwPf0hM46WFhZ4xC5bNCGFlVYq0GnrDOMk2sSletF8wDaJxTXR9SL1HX200rbxLs0Plm2eD8weFT1mZB9Ax6xdMS9kUtpr82TPRHmFavcuL096K+0N1LRr4gGKGArTdQOEqGVFB4zeIhelxjpfoeIRbu5kxHUxUZBQSFS51dCLwDyXEVs95fZlZTWZc4zOCIaB1VPtCikYpfiU4unSsCVTOoY94Kll3QfmBVLboPapRm5OeEC8SANcYlWl4vOgfUxEXfzYy2JXTF9ImMhUpti58/HYVC2VhMEmc9KSAkbwF9zEONdX4JmX0sK2lZSoX7H2kdM4H7kzarY1cOohvSrXJCROau5nMypsX4JRvg7HJVa947LBRAyObYd4AK6LGveJnE2vLJmIqiXWaFTFy3+uG4M8JY4Icn1AlgA8IqWGPFesPmaP0X8wnozvNNECYeVziW/dEdARZl/5oq7xzQcQJ0zp8Ed/wA2Uyt5a73mMW0dvgpc+Lj+1Hlbo76SuVLtQsJaDtW0+hJy0X7T1l4swc+ZQYKdo4tx4i+o8fpOe15nPCAFo8s2KHZuCYB1YPiWrLIg42FaVYdl5g7uAgKmBy7b7y9uXMVQfwqpF1fMdpeQIwJ6f4RUUV1k4kvGZUOru1BQhQbw6H8Qt+gGL8RQlk8Se8uwl7PxSxEVdn1w6tb6qPQXyswmGIJhe30jdgecQ/DQAILL2IuLiuoIm3ogC90E9Eoae2kb3Vc3N9saAM0YDHpcV45vq+Px6Rj02H45QogSudY+ZXGaqwhiIXACqzpK7QtIJ01Awr+aY+0KVjo1fZlSF0UX5zGmsxDSFZuo5HYJK9XaN3Td4B9oODLNDqOMvTvmawZQjqMiuFXSsPRxBa07iQrsQt9WE7MciZtX3RuVobAmqvrHno7Y0mDvOAtCm6A7UyhJfsqjGx5XSEEq94FPusuA4DnHaKQD07aSrykoz8rw5i6CY6NMmrqF+lJxFibvhBtmgaXAYYK7QV6FOKjUrWCja9pvoKrmDjvKdkCBxg9JeAMlzEXntBd27TFalzYSAZ8sN5FXMxXAvhHDp9yKcKvJKzYu8PmIxBXsMCgU73/ETkNFNoaRLxbUQqI0LRg9Ma7ssKOUjxidKtALpLesoIhttoFF5io0yApBHQ2wfMR0V4xG0NCmrL3E1rKBaGm+mZRIu/Qv/T1J8EnGZR2RI3JuzdgtJszAZVr1BwKG/SMCgzzoA4rpBagXUUFDHpl5ZSYrLWrzE6fvjEuLn7aLXXFM8qqCCIaSznt3feOt+t+BqsQSySsge86oJSpANryAKCfxFKIjEFpWc8Sy1YdTftDuF8j9S7SvV+pYdneDvgP75TWjyp6ruPVPW792a70BNZ4365rweD/EqnwQyxlx9pZKdqfiIqxMazgHB164lOtndFxDDVTAOiLGo6WtO4lyT4W+0R2UdAqXCrNRlO9W2fF55jqnrHs/kxGXyQXZAQU9/wBkdt+f2TCqeX9ypkfM0sj1ZyUesAekJ2sgG7SzLkywUBl8wxvVJWy2LNvki2v0I8lfSpa5zzKvuUCKrtWgrcAQKsqU1i8wNt++iGysNQAGm5rG8jpI62smi2ua4hl1dlmh1ExijOnzMX6ceg0LVbQaBMrqIonRZQBi5Am1PCHWyVzEjzlYpb9g1Pgx+hoY77z/ADNrm6DJ9GjMVlSmXptQGAO9D5Nxl2iqo6r89489FU+8zef4nP8ANkuhl42To4txFlJhN6taCOFzWPQHtEZCVoKNOnrGsQz7NRJ0Fv0jolE+aCJ6tO99ZcxqnywMBEyWtxXRYSGui0elxTZltbHVNidic32IFBC6gl0jQmydESsYhnRR8E4atppz6C30hsDVPOAvy2veUGk04ypWkKZ7XAMKGtALVdFDsZEmFGO4bGWTXs5aesCg6Ofy4W9KMrkMOJYZmA4IZwD2jZpMGlRq0e0SWU3AGB/iiFiniJs4xgrqtvmfnRLOAjkrHqj3EV/TEuX1RX8lFNp5iys7tRIgAUKu8i+Co0ZErGxkpbM1fZhM1qaw5gZCkMW4zxxGmgC6mCxg5vRCtigB20NdcIfNFEuCnWMHowcBblXDaJ8RJYmv5Kt0L94fTCbgZm6XMzWXrE2zuOn6MqlSFaTO8VWkYaBMX8xj1BZ4oD0CVBpNF4NssDILLUdA+Y3jHddLYd4dz3YJV1xDRUjwaC2in4gCQvoQXCOwyyNZYg4qHYHBil2nDYH3jtk26iVXur7QUdPyYbi6KkGnp3gxU0NlVqYt3Dn+mlCUoXLZeXpqEqVifJcCxDFd4CtQN6miAo6D8S5gCnRsvue8S7Ro92UZxcVXABdXXjL1KXClt53WiPiaLtDxm++C7G+unNx0JqGrdoNbz7S4o08PjLO5oK1gKzAurzq40kwIoK2vR71GGooEEuzb3zEBoN9lRgz0mWobgABZncEHy49GsjOnUAH0+0lFSPDFdSJehrnyx2N6w0G9ZfV10hwlAV9lFbrIW6Xyx0FPeOGj0MP5l2XeYK1ithuOBGimIzaFN3jxM1ZXb6Fde0qJtWA2ayWppH2YIyuS28rbdGoHFqAeZubRe9TGq1F+GW3cqBACuVOnQbTzEeQSipYTVl7xB0MwGbzbpKKySzZN9YAsiMzVuv4jqWgg0c33heOoCKV4GrpfaPmZUylvoRMy45XS6zD83kqTbVAVvtGubCn4S8rxzRAoPTF9IzeC1hrBboyx18xDgtkzS1nzzEeiYAcR8D5I+LyJw/AEekFh4/mVZazS6j0NHF2yHIWPB4sKoAX6d4ECDKAzZTkFUd2s7ZNoWODGKlQVNRsiFAeELmAGIaQ0faxKFMrWMQlCl77AfmLV3b0XT7/eOlesTl63HEC8dDooQ32ZWVMA8M4JvBEFnxriUx1lMTVDirtxuD+3jL1a0VVuut6hsUxYC5vGkMMZBE5pwum8J6zC3QCum5gCK0XNlyGNtAW9SovpgzIBu+Sg56y6G7SKrhca469oZRM/ZTTI8MMdL1mELAM+WUmV6ynZ9ZwFes5VvEMJXpcyb3zC5jpJ4slVpHaFZpINiqTCrz6RrVxIeJSG+c95e175hvEbtgBOBi3xGMxItNKpSsYibKgs3pRTFDWYfW8w67qgS2HbFadVhh4lX0Ilqca0doQFgUZ/qPBV5fqONF/jpFMHvwrp4C2Or5sr3ZY1fy/6it1f0/uL6X9d48Khgx7UBbNBFG+9ReKOP41B5EeD+pU6D+dJ0z3/AKhOhcxwtRer/ZLSzqxpKM3Y46cxFKnAhosDHLqgpA7gvEL9o6wUSl14Y9OJRDZr3CewvtDl6D8xri6L3BW8JkfvG4WD7Ag4tDvf7xZJCUQz6yi/GqWUUlCVBEN0vrLuj2JmLrruOgiWripxr0xqVhZrBg4KVt9iA5I5UYrc2vTqegfaIMthfNyqFLM+LPtMSgrGc8K26h4xh8QQMm/uiCoCqptvge0bd21ZerP3KZL+afSQ5hYEvVuGiVV7iy7jo0oRMq0meL4It/MtoUNXviPES6QLV6d3ohnMCBxoBinbZTXa2Zyg6hA0zV9YoL/547QestMD6yuwqqvnLOkQJtUNT1UpNvwynQfDC9cHoTvDfvlFgX0RiNi6CiqERccZl6ISoTWBdGsQptvH0A5Lh9IGD1jVElF4LuUFnyoektUThyIoYDmlblpSwcsCtSoOVW+7iN+QfbzADqDXQo0twHSLrZjBdZj0pCjqcYmRnSohhtuxiOZ/AiAQLoawwUBALbmAsgBZu79uMfMxJEQHOYAvd9kqFmKQAYdTrrZuJ15ZGBYwkB6xnNtAW6Wrqh0o5Xdq7o78xlULKVhftCKUK6u7KF5cTdqKsX+1A4beLIfeC+so/cU8UlCt4jYVbGG9IY9ekF9gFlh2wBdgVlas01GidlaFYYv/ACNVaqwPsFVjDwQJ69u+orrtvMeIIJkowlWRa0BoVwLTsMyXavUBwekrgh/HSMVo6lWaBvUwnjZiId28QJkuw4q1TMcLJVGdzxUt6OHR3DtYk0AnOdI9u8ov/sSqyerkDslGsacZKvFmoo4rVLyNiaXZ3gGELyltPX5iu0atCc3DiY4KdDj+4iqo1kH0iK/7cI/g9Z0PfjdrYvy/qF2WUlxpyJP+tKNj1lWpAOPpCWLPrKji9i406nwlu9OhtqD3qWMVCWPFf1diIDoTSvGoAbYLw3LIWXywAITFEE8joDHaKSu16QvzPUaZgU2xzdykRUtDmbNEcWrl6BYVR2+XUoqgFo7QJxmBDIvzMwc1mCKlHUyu4FIqkiOU74fZg64bCFUY4mYhL1Ebq+nMQ4Aq6utkMqsdIfiLHLZCdUJUdxARTnI3KhXMjSz5jl0RboPVh2y+4w9gmjFGrPTgvYPBfiAsL/B+oA/B/UpLEnQfxAobHYPxMhoOon6lcp+D8Sxuvx+o3B51eN+04yPX/JU1DqnL4xF9Tf8AQx2Pey9/OmxkyUYh0HIhCoJRnwiCzE9So/61pWRyvTHET3UDA5LoWsx9u26SCXNJMvED6pvBCu6aZXdSRTu94g4RcEWF0OcUs+an2Rhq9YZajYOMfmF2IVrLfif1J0WgWvlmbHuzNv8AWD5fDCbBzhGLgFQKu2wVoijcQkRWSyV68Si0K7fRpBKq75hiWC6e0FWg5Yz55lSQa6l09ZYgDwQYClDrvHogGeF3LxDjD/qCCUWsVR3hEDIazVRBwEDRvMMii1wQpQ1TkjClWVGnve/SUFyBdh07TFKMdQ9poDhfaVioOnCALFRsM/HEpJwdx+GoCgaNt3FKAEDwwtAAUdszHr4iqkM1AAmpTlD6ypUFXdaP9hQmg0pqmJ5ZILBULrncOojI3Aw7r9MP6rkcBfODcpkyhqeP8oEiDeP1TYP4U2ofDiHAtRF1ML7QVs1rV4i3W1uGqbMDbFUBV1NqnKuqusIsIGmtkpN1d5K+TiCsB1CzcPYEmsL9+J/H6IhReqdBjiXMwyKrpaSvR8f5mXryYrshiZCMLJequ5l7y1GXbUG1yAmK1hag48qBWWhiN0fWHRpxmVd9yl/H/sw49j/Z/wAn/Z0PYlTT/nmdx7SrXwjwe0yu5vVLgt9NAxVFu6gVPZyTOLaN7mbUpvMEJUN+8qANXV3h9IF4Gs0OX1gSzRl6ROcKcPxLrKRcZCOhqqeEsnU5gLiN0TL1TEFhk1qNQJqhRahggGMoVcAZrMOggsrWSitnWKGWO5+SNuX65iQJVqo2jLgMjq4Vxkq4PibQFrC2p61BIU03dfRO39B2g1leh1gbSjmq4T+x0l9RkAmMxK9J0EanEUGh9owiD+/iC/J+7Lo65qloW+0R6pprPMStvF69pnmGFZhnUwGJ/d8JhXz96GQxKGp2CdiW6fREX4fhRYfeJ/0SKYWD7s/6ZP8AqE/6RP8Apk/7ZP8Arkq/eRpx75Dn40MPyrPZQozmJgyolHSgD/sCMyYlanGGrn3UoFSt1ccqRlLha1xgmFQbNtXLIW0FwstLgyuDo79ZuDLpiFLJ0GPeFCxeYy1frXrL2tcOpg47TaEJQ61cRsQwLWfQX3YipVuctTKrpRTYSkxt4G4iUV24z2qIAQnOcwq11duj0JiFA/mWrB3w0j2l0luF7LrjtBRActZ30jE8mWmq3dwLSgFAFFQNwBa7B4Je2wOTkhf/AH4lrCGi4OFks8yukIBIKjg09otLI6kvLk6VBLmNn/sjemrpecqo/MZptMfWATVlzoqYAixVgjeoWcoaXdSvqOsnujUA3ewvaVuVBQX3YQB46DAmOMvS6ajx9n3gkQ9EwaiOkp0gHiU6IvwjDPukBM+yjatqvUw55DRGjzN7+QNnux6r3x/hxX190tt3lAAgmlhapwS+cQU4ivQPOapxi4QRdnD9G59JfFt5CM6BWsTGOtlHi4NLKNWp9FabaeCtw3LzKilKXoS4DmrI210gdul01WDvGzuwwZTRFSJMAukp+omFYDq3BajSsjZntGs8EXWm+MxjG5d22QGVwaoXGgLHgvvGXeJtu5gWNgQZ7TPGwaoD0oRkL6508S4fpBQFJepWGtAZunJXywjQphvFqW8ucvLK0rlMSw5gBP7IL17fdj7GoGW9s4JYx2S7apd4J3vxBOIoSaWZmWYqh1l1o8J4SMCokOgENgLyf1DW2eP6iP8AGX2/pgf+EI1WACrKVKRfuEaZEdKK9bAtka8q987H3RT+9n8DACRDUuL7FFCingfqP40xo4cANYuCDSiHZxbYL81GK4cRLmDH95mO1WUqo05gcmDBydv9imPEszWaABEgqpv0qbQgZxTLlCVh6vWFpbaisfiLAaGs0kQaKOM894XSsupSixTk5gK3Wuwrs30lbSqOB6SkAPFPSKwNtX6Q4BbgzEWRc3m/absmp0OMvEpOkWDSOq9Jb/S4y2q0jsC0avbD4YSREQiab92pgAsVN+0OFG7tcnSK1CilEhB/mpR6oYGyBIwnRArCIAalhzBzmf2/UdXWW9u3FRADdNXBVW21SxJTHX6XFEli1RljMBTYtekKUMptimOnP+w+iowQz1lja48xW+fWC0z7ou292Upc46LF2SUd9kD37pKzKodV4ffMHf1QDg13Y7FXePEHmppvglX2B+oiWXOzfsRHDeER2+n2L+ZiiDrU95d5VVH5ETgtwcTaKGq4hLlA2oHMQVaitbmHh7ZpPxR4cCryb95YbJXOLWN7JG9tV+YBs/SAtrhw8xbKcaO0bLdZLa9oCpfWUZcf9fEmvkSqzo1a/tFpixlsswzQLIoZdt7X1mcZRTA7PepRWR4J1pD5l42+opA2/EQLlWygPaZhECwpLempdryXFQPFXv2hQRA7pmbVhSmxznnj3mV8rpFo8dSHDAESSSof8YuMPtBKz7QwywJDIhBrmOi3mNyjZP8AwgvRmYC9vMOoGNbBqrr5iqUc3WvXpMmOHbpMq6uwt7X0jCSnkJdxrADxf7l39OH08ONCa5Q2tr2HEUL9N/2NIg/vMzlkQtKXkHhlTlLsbovFswZ/NI0HsAfiV7b2/ULKgVm2mWaTz+ydH1S/diOH3pGkBDoCdm8EQZ9+Kb9yBbb1mwY8s80NoZuGpigUzsuGYUAcTdnMzEzJ1Exs8xptNbuYwsuZozEuKXbDXPKEFfKIhn5+jCsxh/FYO8Gk4gNy715jTv0CsXjsQsyagUMMx9IVT+IaZgJgUyWveWBjODb3jZvlybIHL2iL/Uop6YdSvdo0BsfxBQI0BhP1UfuU63ow1jejNL37IFujvirOJZeaFu3z+yFZb5k878yCTqCFntMwtiC5xfmODQuagJGnjG8lveM4wVRnzKKgbqv4l7OuVpFGsxtcAoAFEI61E5WLSHRLUeAQNWAziqlBPtORROrCpYc3f230i0CqEDXxBMHFcRvxH6bDHaPtLiMNHM3QjtLvEzG3KMGIir5o8BduIVvw3oyX9s+sHVe8pUsg70lBPaINCcqDsFsRmEqK2Dd2QGaBA0ktGgpspNNbThAqbK3LctVg06MXLmSGDYXxCnMUGJIE7FlpKY/ohwfz+0EtCovJ8R4g15KhqaC3aYHND2tSfNyo637W6Fj3h5GsI1jh32YG5NUeGn4uAHS9WBgZ8ELqb6ikW+J/dC/ByDBza46RGwAUgx8wUH2X5mKJmiUaC92QX3LAyuOPUzrswSkAAGD2h6Ui1gY+JtC9H6jKlNZCAGUqxN1iMCzB0iKl3WUZLsw5QlHl4N+8txTTInZUuJdxR+ICaUhfIG4+X/xQ8cYithQgwCNCmveFYCDij5/xEuEeRFtXdz+4ovk/ZAyRJI2Eaq5TtKdp4Qw1DLX1PXHpTsxLQgMxIqiq5Rf0r/BCuBrK6IkVyQULxLYrVKFaym6cyy3gG/v19ZmLpZZLiaZpJ2x0IKLi0FD7wCgqbVrkrlsvLWzpAkjoDlLHdvTqXFask3G8sq89YnZpdgaxZzZvsxQ+VbRiXkRW5jMwlpxGUP6n7zIfOgofy/7TQwzcX5gVE0pTY9SA6Cwtj9OsZaqgpSKWtQZRVNJNN4rxMJC5BG17uAddlUjd3lnCR6/3ClOI1T1VvAY96Mx1akW63xc+phFF9DfiPQD0JQ0HrLGX6GXtD3/VDm++b/XxLQjdx5KMO5XiUbdggA4TGf8AdsbOnjV9dZ8QoM1VbuUOJda9acjaXAPcGIJTULb6dIPQPdBDR+ZU+kTRtkHSoJaewj9mzB8n4sUNyGEPPlv4hwyC3opM2iAomJDcC4DExOIRAZD5JUrtA7f+b+iTqnKLcX0nzNmY6AVcAcsuGbtldoYgF25PpNLq1pcdZLmU0dV/EJDbRsxoKLFtFkAIQpysCgMdZtq3iImIjrwOB2sWehktUu4q8L7TaJBq5hTxDk1Kq+nzA7P1vzB/1PeDQI03+KVGN1n9cQ2AaVCviJGDycDgJqEN16rMqfdKnIqLnLHjNxNO5haqi4y5jyr3lgMMC4tXgFE8seierEjA+qchE8oMZ8V+H6n/AHiVIvT7MYL27pKcLLnzeylGq6l5Vq8LgbB1cRBZQvbEbE4W7mIoR0kGxId/pw/9l+i1FixiNzMyXF9pga+imW+lq++Ys0u0XPVahiTGsqHgmgk4XF8wj0Rqr87gWBdH2sPwWxCh47MRQ1euYekr6LGy9+0UNKFWKCIWmGVRJLgESaRLoKDsRuXaVX4iv2ijA4cwLhVBmMwT4IGoRowktr3+aCocMRSvLHWEyLBsY9gF9UU/cVvtfO5gHW/KJDgnQX1ZyPpLcyyOIgwF7YquP18RtGks8wlTf75mWC068gN9ZfIM3QWvibQ+Wippa6pDs0P74ivMSWfEH2Yb8eGAvxVAI7xg/MCMJvtxbBM6inQEmqB1v1y/ISXCtaalh4NuF7L4gV2krFp6cRrgN7Td9DmU8Y2Aq4dStisfbfQalkuXFGL95lF+g8P0hja7DMyfOdexzKV7hl+nSWiLPEV127MUvp1uHWCvEUuyUNT1htHmhekFAgdHlivbwbkrS9ry/gHaPZk2Ry9L4gUtIydUa+I6CdcxY6RXDyQjYa6QrISVurCj1CNFURmH+SZjqvvBlV1BWU5S+IPaCi2WLY4gQPI57QUCKwmsKXCVHlEiC+5EnbECZwxgXfmPGCGhrNQoF5xBpQ3VsH8PKKrtUFcSjn5lNkV0lW7XoRTlvJijK8/oiu35P6ifRJBYhl/VhMhqk86k6wkitmC3F41X3mcBWLZoS5mALdRbcx8ftEwF4345jK4gm3/mg1Lly5cUMZSKSntKIVTZWg13ZmZuUt1FTgH2RocYXjcoE8JtoLXCrvi5aetWovyRViuD79UcKc2uUiRYdZluhjL4gWWGihn1CBtl0q/eXfRl+ybeJ1F8w1cQRVGvgvqR2wNZR+G4cAssdnk59Y0wAWzTpUGviNE9EIKlcZq9dRegvgL18SnLHsWeaUC/vGrKMZZ21wvcux1xHzQdYvUDMEuX8VBn7v3h3MTLhI0p1uZcMnZXjrKUGcZxUDt8ol6spfm/zGXhHnWI0hmAL0JYIvmNEFPaKr09pRO77RUuCfT+dAeqLIr8oOfWXHRFyS8vmUM965fyumYc5FvpLZpkg4PN6S7yFWO0GkAIKZCtniG1UUpXCBoxX7obt0gP9+EGDf0WpSwst4jIucjz0jNLsKPKOpMDB2mr3a8BcKD1cb2NZGD0GIKWvqC58Rwm1NHFcHpF4qWqBpYFaavPSONpgSwKwD7kx4RYFAXLTXqQnp6sjg7BgJRAyhZQ6f2IIQcDLVa3vudZRZ6JMol4Lu9sr5U7P8W7Gq0yubLytA223bYYiOC8mq65F6MIW3ln02e8Bk3IKEozjEVFdZO7kjU6DsYglPioKtPEwLpjd0MUKu9oAWJWgFqwM1t7MIekAVAePMWSDPEZiubW82T5CYWfwDU+e/eDcG5x24W+sSMhFe8zwVV0C+02MFtXwQ0RXMeNJxb7RnHDqfqiDI9b/VGxtHWx/EDga8K3zAYE5VnvCq3HIeuO6aCnFw3Z7aU5t+0CZR3/AElOvKREDHvCVl+6R6z4jCWc4MS6DoWIb9jTL2Q/veKJrviuSr+rGO9Jl3uaMtyh4R+8xCv7UwCFvuoPmCsBQZyMPKRRtMn97zmZIDbtmINrCPGEYsHyURTKgVvUqIkGsuBTscwpSQ1So8ND8XG4pVFNZxjjt3gYHDBk7Z8XEFobUh0LLlz0Zl1JYXdhf4jLJMnAy5rmY04EwA7uK9pW4uhHoOONQHfSUVVYzo3kIMS0tZtXmmmWqhVkZzkS0gG1BourNvWEY5bFKvVHMNjniv4N5DPTpKaVhTlF9X29YQXrNPovJ4+ZTYA3J7XBXkUMjwnJ6kLR0qrPsnwR4S5vUeRl6jCwGcLO+vo9pb60gqLhHIzlAeYVY2aOIEtgjAbzEJIM5XT+xlowwUKwpq8uT0zAHywhhwm4jZrihBmjmjl7xqgPC1aDV1rfMc9mNhhLlz80faD3H7wUs1gc3KVJAM4sviVwE5YDzKKIjVLj2BtCqDZAuZswRFWNJy50QAOFqp8ExrV7uWLFIJU1Au9kSAwFFhr4iu2YGe4UJ5JSBVrCAaUOExZ3EhqzkgXgnqX3X/gDBmJcWW3hYry3nJ/1cZdvucTdvTvDtJXCvXPeItGXDZZmrKwSgSclgrTnozTILFkgynMrQ3a/qpkKEzhSxOoGQG6vp5gXULYc3AXkvYgJrscWazUHHsEZnQ6Wu2IzcHRd5rf4fWJaFWLdvStkpUQalLT00F673BMQsiKvTncLsSScuct1SsGSP9XDXYBOM7wH7jgLPho7vH3l75aqryyDT6kO3YVaVXpz7wi6aVh5XEwm8trB8c3EMVyrkQraNXEdsAbqHGuJxIALddOsxPqLh6mTuWRApC70eV6GdQACaELhyAEBrCViGDSVsTuNnaZV0WstZM2c8yyWUSOWWzpd9Lmb1aFDQ4PWWDDsmA4eTvsnBdWafPI8MVw2IEUycx3fLfabI6hABobXnUWygaDfn8xgOo97kZc6T2lOyrRA+TaBo7kp0XyxhI4I4o8/UjloSwaQwOZn5n7wlsFRSnCmQPlm0z8xly4rYxW7libAVqy9S4oTFrVXJbn51BVeLZ94IA2Ys5JKi2fc+YCyB41FmH/jrCm26D90DYYCYWQhopq+xOremK7zDABhBxluGP0WxfVZcMfRRt/jCNNs0qcwUUvXMAD1fuC182aZPIP4h1nz+iAflGAWAFa5x1ilkV4cDOua6Yj4BXqoXSnIdIrCipCTdtGBI0BaEJf0B0CoaWEMUZxd5JaXcwtu2jIfeUWrNUrXpf7mYKrhFuVdeI0OoFcDoizy7lzDqhHKHDeTgloRGpZtDKu2tYjwTVYAmaXhgYW1kaOQfEOnS0qxbrpefSY9jgk91/EG88FQm7qmw3hIwqhehNcmeXMIuFqmW0jYPWuJhlCwAbxpE/uYwjBWjb8X06yyi6tLOFyPUqmABwHaU5vHLHRplUFIKWVkDptl5ZuNsLVwRC+cusylpsu7sz584gtmefTo9TtLsxCbyc+pDNkUwdYqMs6GjBAorKc816PWFnrdYEKams9HIxAA85P1RGVoFWwwG84ipmtsOO+4wwNB1HFpjVTe92HP0qsyKmcS0Ua3UqMW9qcoAoD5VPa6g0q9TvrfxGjStiq9MywFnFMscinRnfjdiB09FEe59jFPsGEKhXAclfNSgl5cL0iVizpDBEkZtp5IPfrhC3PkEADL4X8Qmp5UsfBX8w++S/c6vnQU1eQ/EWx69PvBirZqag8/4wm5/Vs0RqYjAQtU0iWXUPmWF8qAzzWM1uK4bOprC8YpuApNCoO1sOULiGptVBGts3WCW9PeLBpw07yR0B4Cpeu5Y1CgFpjIxaxGQANE68dZS0OZ53Xye00NQEXGnO+p7S7Tc1Y6wX1yXL8rrCrvWLS5OAVUK+xFRbe/Vvi6l4qGNsKdO0YIECzJbMpTi32iP52kO5bOczbYcBtwWce8pCCgHbr5j5CRBs7brGeYAYnVmTGWkekyYgoqGsF7vWAggW7Nt1VZlltftNxT0VENixmfPpdkjWnxpJjRTeAcPTMYl96CcH6faAOAYRghV7srP0gp3Sk3LDcyYfiWtVITg9hEqssirfLOfl+l7lhVgonDiOZxt2o+0Pl9FFeKCt4ENNXyIh2jeLIctyWAt3iUfhP2R8KbgTSOCe3Q+Bb+f3E1cGzY82QHQDdSnP3jjASx0DE5nK2r94M4BHwZ0dy5zCxmMuVWl52zZyxbc0+kbmf0RYcbqKk8v4wnN/pYcPoCsHS7lSdZZGJ/JuNNiKQRcf7ABYvHWT+5i0RsgW9Md2qeM0whONtBQ1kxK5aXa0ttl8lEdekGDqy1exx95dL+py9CbGYN19tM7JQYy4sviAY2mDOtK6CmOvGF2g8a2e18w0EIwNhlyGYGLeAA/wBqJITIKqLm0vjN1xUIurJB4trJBDiYCwqr3WbK3UCKQRGeqvn7VEGPUVFUXyzpxqGiiLsUWEenvmMxZiG0JWTSdt3qIjlpi8FgHfXrHTGk7qkedX5gIlDVgWKteTT2zCZlYFV3rGZWqoA51qvycwVmlJbQbtzrOYLoaHox+1tE7vkPx6QVXSUgOQYM0WEzqByRBFhY1BV/X7mDlDpYFtwirdTNiYi4ByF5J8rgY1m+wVla/EDay3go+UinB4cbMB4/xMqj9mAo3FaCLj9BwyI/mHOSyWjS/iCRlb/7iFgs1RgrgFazjtO9MkxZiL8wdV0nUlwYtH0CO6fxSfB/dhsRUsqy2fAje0DQA5LdrXpMMNhpGEb43uJUNlUVf/YO0X+zcEih0tf5Z1L2qWtfHPn9RXUeqKjwOmLhJiALGOqOURdEQLQ6vSPpX5uJ1DyvPMTrsXLlx6RpRVA2nQLl1r91btxvt+ZfjRplFV0Pkqvve5rUNX08OAC3eaqMO4cDmPbtLrAABFzMuXL58QnVguo9DHxGIDZ4GO3HSPkoRTNd30xMskrm02455zDphOpdLvsVmmaaTUKjp40+kpTBtoAvBXxNixGdEwBXT4ikpIBYPe/aYDoop18RsoXLCN33hECi4wZM4e3rFQrK+FMn96wi9d+IfAYu6al14lu5qh0gnuD1hplgxuIcRE+X9zEB5y9VA7xkgTrp/sIAlHMHzb5/7N0vEcc/44gLkV8SrAioOyIMFUE82/Yg/F5Emi9tBMP4E0w94It36YivxKuXOvtZ+2CIsx3lb2S71/SyRY3MkVU8TAS4t+ZeGLBMf9OiL2X3ZiZhywKpM6o6OvJDmpr3ZHx5EsNS1EF0DnKMccy4VGWIsg35DjBx1mujMO40/JD+jqSrXhsz2f5inG2xVjhGzx33BEKWt0apeft7RY+5QLNfeu0ChEhaXnrUWpaFmr6FdReGo170kmDSmrQXDUEaEh8iuHcap6dNBXB2qXQolNLTzfx7xZIraiXVNcHMeXqrq6XqaoLCNNNk32jcFVFaLMGOkqv86K32OmGUuxKsaVd9f3Cu0/WV2XOaArriVkZFVTgt36q5u+0P0acqF3v/AJCJiVdqpc1XtmViUFJrTGGeajZsAw1YNwH2to6v5HuMOtiUa1gFnFcyojSHdcreKx7QEFhv08jyW9GVUpbWxZmn8MJtb0/ExoTLumaS6+X0igj6wnx9GVZ9MsrXuTK/uCBkm4UDFyEtSjlcS1F9Eq+8Z2E4sD0zNoGOzEvfF/tDcNuF+oulR1crMvyCWYu3lhwJFijHfpiG6UNqGqjVf2xOq8qNNlPMopKHdGMhdrPGfxB1GlC1e0GgVBSmGtaivfzkIv4iKdosxZiDaZJx6RamTuPMvEzaB/B2S1f1bKxmIWAFfsaz6Nx1FxoVcrw4zV3BpbIcY1nh0ITxJbNuTutq8lxUdUTpbdQg3/xREqUdDdgptRK4gHQYVUNDLdVV3EFUwwRUeeQ8kslvbDUSwsgtDXMWAYZVYog1e4NEb0FUsuwxYsSKlbUBxjXPmLwcq0Qu66GcYeZRF8bNCrht5i0UUQm3tAUc1gx3P8Qa6KFGzWXB1YvdEsyUGFWBXUrnDOliAxVbehzCUOJG1O8d4wZLULEqss0VwkBfhgAlrNXvnPWoT5yg14LO3zE16VnhaWzzc3QAHZDPn9RLI5hIFB84YeAG8Fa3D49CLtakODuvEutjbmitx6Vct1oA7G/TUrHmmWAw3LrBHgwatZ6I8Iv0Jfsrgg/MqWJPSUD8wRl7KgRDuGX0l6B8aDuBLiHDIGoCywcxMzlimwghu2vRiymhf+zK5HMWxy6rr2i7pRazpNyBRZRJinKguLYx2mGiwjoGPWAWGGXBYY3Yq9pDbLtChz+ODE04N2kApRHXcbIhI2ucfETCh2qNez9UThOKoVR1qN1jTw+5Lhpa3f8AJF/ej7LEi/Rv4nUL/CyH+x/vlJS9UfmdpfBKTYnmOykOmf4EEGwljuwZWfibwWyxr/kxRTVngAVurmJKE9zwfiOg0L+S0dRSwSOIQX2dkVabh2vnP7hRVWtOVyPFVC2BzHDv8H2i3ll8p6InmWpuufaDIgNYvAJp8etwH2ICXcHV5x8QyxABdLv9JuY81KFhbS9KsrRcAI+hY0ZsQ1f9zF0BwUtdCK4ht5xWZd7I2cd+YkZuLZTYA01AGDq6DTS8qYO3eFMKARcPodYK2B3iug6l0AjR2UE19pYoLZCuKPWcLkPPRyg+mu8xJze5Bt/uYbHaN8HWoNCNDa1NN9z4hNQ1RCB26swRwmxbz6QdLyTb+kRiHQtYkL3qgwsG1QUL+mEYgJ0oftC2sXZr2IxdBd88hKrgeaNxVEJqzfaPPhrzf/Jj1qYxzKEqswUTMpWZVjbWLfaUzRpi4wDBrUYtws2Q5gWlVMVwKhziFSK+BbnqZ5hEhSClfzoRLLsdn5S2WA4t9pTIZAJKZoo57f5Kqbmg2eJeGqKpczprtDgBGEC+0FCR0mLU6lVXVJayF0KEf8hRlIQr41BjxkFy9ccRYgLipDCNvIAeiQjJVAwDOdRzduwfJhASUF29EMyuqqBeQ2IIWZTcdka43L0h1QrVOIEEovQBxqGge+tPuQEe0f7Tft/UMQ3e9SkUKHiXZS7VL2qJrEDsQrtErcJgQMHcsowPeDSnCKq1GrYHrGu1VVCwYEqwF5MwXcsrd0u4HDVsXXVcBUBMAFX31BAvDgUhcxupF6lmHvAFUQLRVMY3cKwqgSj3gu3vYYtV3/bjtdqxqaoe8J2ptsynA6vcFyC1tm0iJkkS0KrfP+Qk7tRbT5vGZethDNvVb+IVCCQfBuCBaXSL2Xuu0GaHPKuCYjjjEQCrpcIGkjKA+uj43K9awaF9jtBik6qY+ZiTUvkiVr34gMUbis3MiQN1wwHnqxKYHWfvFFqt1mAN7qwkO1ZZlYKoHwtTEEPqO8AN9DDxBzIqnDrMuwY66lxl1thJxpVmM94PO7bRUKi8bEpaSuHXvCgJHbV1NAKUK7R1WUs7TN9MLz+o4KJ1O0U3fjrL9sS9Yq4qeiDoFeIIGbWs7H+vjiXqiMqY8eIBwTJaMCa+/wAQ2Cqcg6ek41Xw/wB1CpoeuK7QVY7i3BKbaHg5P+wkRM0A337zeX8JRaKZ5JW4D0SZbxC/M1w8Kb4+j8IqUHZftFGUX0mZiASx+0/eSHffIEW/dNIPxFmaeSd56kpcgwMz84U2iB0Jy10bg3ntFlqKoVVx5XGoZcWhf49IGKtAaA3R1j5iBBYdB1ZiOAiAxY51xHczoMOrL+eCMuu313gA+ajKS7EZVWAt+SWSH0P7ysAlk7YggiOEJ2hWe/TK1hXNMviAIhQrRPWYtk6zT0+IAOLQiyU2IlOQ3HMnpjETJbOQilbHqmpqC6vBUVB1mHcDS7TzuOKwN4Y+rYn9UOduaSLDOM0x+3pjcE5h5xGcHztKpJ0F44ljYPJGFivu4+iIzVYzr7S0FjqUyfAjTMcFGajIFK44Y2LW8Z9IGHrN8doNarXyx/EcjZWMMQq1tdZvEsKwFt93/kpogmRTJzfn8RtcxozXEwkBdqqsfqBxCyrR79JeYQd1jr+6TQYLA4o6sDc+Tb6RXLRKyWcL0jaArhdesQY9WNeG8Ule19WcpHtNtS7sEgsHNVBU1drgF3PLE6odgYByp5g+/RRfsUo0h4iWhnaI/wBJxy9J+gY10lirkPgJsHu6SEquT4pOIzTEcP6nxBuXRbNlOHF1UWFBymT06wxoWWv2gbCFLLXiJY2rtK9WUGHvB0YJSGECUFi1iLqBufxG2C7ezb4o0RtGipT00x8oOlYGDHG9fXzL0G+yGFbexmKJqyBBgXRvpVQhbgNQyKozZpPMQa3q7jGo9QgsNWY6XDqqI56I4JfgzcEffpBCVHrATd3zDEMOV8wa6s2jn+uMqMl45hcDVar4hqwJ0/nEU2mtU7YvApoalCtlqz8Q1UmrFmQgowhqAmK655mYvZVdAwQUtrRCbKrzYb8/mHhtE5f3vAFmtCrx3rPpEJsFWlBBA3QoUzl3/ahOZe8JVidb57QSDFjR53/eJRWzpN86+IIKkvJadiXCrcDqtHftDBYY6RPaebjuX1hZikcJa6XKVK1FdgxTTMGF6IV4PvNuE63NlcSbPedCo9SvSVePRNf4y24SK0X6y+lmKFK9SEWF8S+wdxctg/haO50gwYaaA8dJk1127F95ihAHnqVgxxpovzUQiSru3tDTj3IaVMZZfBAiqlLo9fSKAKNWHfPSA4FlP+S0EpivV8zPb00cvSIMsct5qVdUEtO0LFVzwsrShTNEdgwbpNEGIEGWvz0grKMW5HFSowbVe5catO1yyhTmmXnAbpjZAyUv5lgbbZ1UiFc1694VgUIG6X2Eugx4eKhmJVadYg0Xb6lwC6F8/eELk9WJSNaXjjvBJ9kg7QBA6hKOfy7w/LAo3uH3jC+2rgACDowHmHouMt4IGUpayQSi1RxfF8xVOvCYx50fq+0oguaGtgn+xGCVm8C85f64azJaFFdLYDEDah1P/ZZ1WTAjzfX/AJLEooCaej0zCs0YrwekSFB4YtuMZnkTxMJmGecHavqSg7JYcL7xuwnAQmBhK8xS4T3lotvs3KOR5CPcAch6MxZ+1loqq8xYlV7LBLQz1xHqv5JQaPiJdlHclikHuSxyhHLBXiHyFTCpHGCAOFU3BlN+RUWNFa1C+2ee0w3HApsYIUaHZrvUEHtuQdus2mIaHB6w1M3St95QrXw/McYAFVs9mLAFtZ6cZ8Ta3M5fmoGaLnVUw8gRho+II2Jiq/MSVdBYcfGyrlJ6lgcv77y4s0YvfyTAl6Rxw5TcXhuqco69Io1glqtXmJ1TuN5hyBS5uLQEeoXmHc6WGM4/MCUvcx6R3tUOR4vUpbK3e0pYMnXEtyOudd4Y5OaO+YMHBi2FrTdtR2UNjyeI3Q6aGy+kKjnq1B4ltYQwsnPN/wBhi5RqTr2gBe0w0UsYzy/zFRIPKKbD0xUVRBvqD1jcYUqhQPNbdRQoF5bfd/ZiBqCrZTtRxnemXChQOaZhse5VQhpeIeH3iZ8H2g2X5SlyhccLpKavWiG2n4lGw8M5Y7blBpXiOz9mCKL942DJ5Ivao9SU5jDkfRnR3khnHCjhfIQ5vQYci97leUPEtLWHY89QxxADOoxENWUryUeZeMHRj1/FzTAXau3jLEEbvpacOa/cB1ELbxx7XuB3a6G/1qIvIda1/uZEBmsXLIY4e9yy4N3Q+/zGvQaFMhLVInOKv+xDUS2WWJ6+uOIaltYm6YpzDNn3/riVlY2uuuILAVxw8fqYRulBvedxI8RygV3Ov+xICJkoQi0TbdOutRcVZt2p7Sy2lnWd+8NCBTfLpeHO4tbMbtg6K9Nw46tQaWdv1FkFG1d5xLuhUovFPmMAAWtm779KixWXW3GvfJFU2ePtEqmdrvepUFojY76X0i+XgA56faYEa1rMDZEuE4K1EKWugbc4PaFPec0jadofGPGIYHpsUtfXpK5ayw4HrAI6UAP+JRBReVYxWev5qWgUNYqjvA7Qa3VV8vyX3iA7Ky7K58c/zCrysFavOZbz7URSlPJLmR94oHKuoxqa36Tvg7xY/gYNye8bwHhFevcQcgHZi8u+8E5ovP0cwvsDE4QHVPISuQnxM9+2A5o9ZY0IfEzcy2QeoWLrbxAOy11gO0fJLNwKtw7QRXbDYStJ5KpGqerWL1tiW5hoV69KmDZXY+RNV2JRpQ1ejOUoI0RkLNbZoG8EaEzQ1XNd/O4IOwNZvOcYb1faV4xZMxYaQg8Qm6ZsMcU8xIGhwenWX9LyVgwb/qmZgKCmz+3EhSYZp6HvDzsYyV31LEYOF07fuJkymEsEuOcU/CuSXQpuhvHj1jsJRRKfEUi7AV6H494i1LjAqc8BoDF/PTMziBjCEfSCxJbiYy5rrA1BQl7v8ykmW3ZjLvMS1IrIv9UceL5c72eZfGKME5R1jWD24gRaEyNISCgumx6+ZbVSep8RqWLSxqXQw1k48cXBMtgRb1x/YqGHZrrjyuiVk9ByhwDwS5PQCg328wDaFkVBcV59I3UKuLwB375PVlkVGsDV+MwJgLwsBo0VE06FpDs9PiXBuFTmI6s8QJmn0ZTVj1jLcjswMyPhh3WDkdI2b9iVyQ9sRGhy84mUAd5UYL7QY0x3wxEcE8xtkXrKNieGIeYdy4Z5+KXwo+UBut94/kBDNun1qK5odDLLdqeYX0r1lekdbi7x7T/pcBcNw2CA9feJ/CXKM/EwYJ2uW4WK90IpFB3IORL6qW2luAQqcF69A4qLZg3R8rlFfUtZGvUjXjGRznDha/7G2N6X2ZoY6uPEGnRboOOay8uD2lkMhpqDoXGFvTvpFh2xUoKMFvKcbhlQYQAX3epvtGTBQsl8I8fHMd6GG2jfTGP5mzyy9UacwCsoNN9GIsryrnczTBwbJUYHIrvcqVuUBQqEwDKDCLvDXxKQtMCM/wB+4HYMkFHHFd5YYLJSZ2XTEx1V/wAeIGuSzkL7nPpGllKbFr03eesOoR0Hk8ZlsK3Bfx5lCK2KC+Dp53BIJva9Hn/JSXioKCh1W/3Hl1Z1RqnTr2ZweGQwoz39fNTBiAdfV0/MbtUspqW63MwI5rT39JiOrYwb8c5rxLVNsqpdur99wNWAAUkR2cLGzd7g6pY9QeIk+CFH5IBP75ZcLgSUxkTvMVxAmr95xlfIMcYo9oWrT2zDKWdf8RAonZa+8oYzs3DNzA4Wj0msBGVBLntAW6d6YoYGf9Uuce0Kfsn/AHECV8LJkpH0YHsg3D1JgQ94VtW2C4B+Y55cAhGHSVFCZYtT4lzY34YXyC+8Fc308vPaY5w8ahbtHyQ+b0EKAHlBuBlhutR5fMDTa0eABwHaFwHorZ2hWPSLRM3EoFBRiv8AXcBbOu08WkCu25cJLYw8bvfp94crvRy1za+1kz7wNwVq1xq6oYjUaWgLrk4d9tQpYULoc4bvyb6wLMUFDx38Y3N2wtJw4xrG+8QtEq8N8X0I6jjozgZxKt5AxOKcq6dSMzKIq/WKDHFAq6N07b/5Fhoracee2YABFG21V4Of9mAAt0ADiseIhRSAIUOr89dxEAN+W4B7DlKMlS+DWy5i/wA7xGIIvQgW+nLuAaFtEKC4T57QaSlkuxinkL6V5ZTJCbtq3eCVSA52ekU2j6Rqw1FsAzErcFhr2hLo9biNU+kwVb8kpi8+0opfk18wqFD2ipp5ELPwYEco8zIa9iAU94vMNwDs3+ZsLu8dQXtHq8AwdGkR8h81OU/eWtfUgshes6I+Mxb5XtLEiW7D1w9JU+4T7zWCO27WWGD5lns94IbeepGxeLgLINvMr3O8FwpBHR6xmnPxuKlBOlFMrDa1F6PMdNr2xEb49swTz4jzteYqdGNDK+8wYZB2wvchdJ4rERYzwNy+uUrJvxCCY0u3dSnfeWNILyDQ3wS+w2AL2sr7YmUI2ahqgXo68tS4seizMqFrCvuihaRwXI6W63XMA6iyEyUoX5zoGUe5bcohRzii8eIzjb8nggBtx5inrQqKXX96RcVRTBzdtWJWOIMKjFux4emfmVTbTQAtus8UwDkpACHc9NNQYx2Lowdf7vBMkEpdmrrW9vWAgkALCng8IF3J6k3XQz+Y3ao5FvB2Aj0ihBeK5dc1O9ekC2epHnVdmN2F6QRR+8bsCYVI8kuct8wdTS7nSHyMBdL2aZ0FPUjYvHuFlTj2WDO196lhkvRIBpVnRK9of8b+Ijh9U/MCtljxOhPrAK29UWr+CF1t7/tFph9EFu3xENA8MG/IuDNF+IMfsMMAS4rU0G6X/kEJRfNTCF+GpRwegdRuN07yvdvJC937IpbT0uD0j3IuYUPMw8S9It2jg8EALIAgLFHvATEHzWPCkox+YhunmBC0K8LZZTj0g6wveUNfJL9SrGwcrqvvBeD1jpoO4MBgfih0f2YF5eRF4oy01FlDTwmIW1EmzErARMIaiTFlZQur1595rfGQB0AVRC7G9aRWAa0ZV6wECUfnCaybHbEtKFbM6ZevvKiCthJvRfU613jqVLdNNmaq87AsEc5mAciFrxZ+XbUZ1oUnDRkKvxBjsu62dBGRhfGGVuNeA96ijOfeWMDjrLoql0wHS3xB1FK29JSliN3KghqtzpfcRfYvIzke6gOBX0UfvOlXipnz+z94qrE6PwQuL33p94Xb6L+0DmvD+yFbKDqB+0vI8qw+ZbgeQD9oi5T4g3j3Qxp2wN6marPMoMt4ZTlHtFahZ0VmMyEOI8FU+GBgLea0THK9o1N19IXWIhHIHsk7Q+Gos/CDNO68lQHQe9wPQeGDTQeY2yPtmVdhgmiuKuEPhJRYETr+0tFnzYujEKlYSvdRClBXXFw5BXZi42eIOJPRjXCe8DaZ1URcY95TcjAOY1gIFoeGBlCYgp9xLokHSV5u3TEbaJ1XHdlrlXpFSxTsy6YdwPRo4Bltntw3eegv7kuCM7+ELkhwUekba9xMtIeZ01940/sijpRbFvEQN5qIO8Tfdt7RGqa8p94TNp3BgblfCkrQVfiGbQCNWDDWV2oyrTeaRWLV0WL6JDA/wOkC73NPvFixyhj0rcUVh+FIrN71AgXK/k/yBIx3EWY0r5Rt8zErdzHpFBn2wjgQAac8u1j0QOTPZhtKHfUJuDpKeIc13F2UfE0j7Mx5+IPkHwwe6H0GDbbsDBBC9UubkgwqvtAK+5slgKXjZiO812XDXme0ru/VB2TZ1Lg2sL0hmH2sFcgfFxF04Mc94UGTyRV4Hwwo54GIKqg8xFfmOJKYlKBRuUVm0u4+JYmzpcbagS1td6iOcPahmOGG7p9oh0HzDLtd9GYNbHDKos/CAt0jwoX1PLGkAGGzvChYFOCMmxB1oDcU4D5f3EYqqUKxD0BfZmggzlB4J//Z","type":"image/jpeg","size":59712}]	2026-01-10 10:55:38.226	2026-01-10 12:19:01.083	2026-01-10 12:19:01.073	\N
\.


--
-- Data for Name: TicketNote; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."TicketNote" (id, "ticketId", "userId", content, "isAdminNote", "createdAt") FROM stdin;
cmk86mxdc000098qmfmnmi4un	cmk85je6o0000hgqmu28yx89d	1	Same for the dispense records	t	2026-01-10 10:48:53.608
cmk86z2z8000498qmfhzlfb13	cmk86vlko000298qm4x300cfo	1	Same for reports	t	2026-01-10 10:58:20.754
cmk89etnh000898qm7nmd7dza	cmk86vlko000298qm4x300cfo	1	Resolved	t	2026-01-10 12:06:34.388
\.


--
-- Data for Name: TicketNotification; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."TicketNotification" (id, "ticketId", "userId", type, message, read, "createdAt") FROM stdin;
cmk7p2geg0001d8qmh2dzwejr	cmk7p280s0000d8qmkpwwxitf	1	ticket-created	New ticket from SEMS Administrator: Cant search for a patient	f	2026-01-10 02:37:05.032
cmk7phy5j0003d8qmr7svr9jt	cmk7phlu70002d8qmnrhcmixi	1	ticket-created	New ticket from SEMS Administrator: Dose calculation is wrong	f	2026-01-10 02:49:07.879
cmk7pprzq0005d8qmfytbgws1	cmk7pppxi0004d8qm3akjvrmc	1	ticket-created	New ticket from SEMS Administrator: Cant login with my email	f	2026-01-10 02:55:13.142
cmk85jlh40001hgqmwzwsw3as	cmk85je6o0000hgqmu28yx89d	1	ticket-created	New ticket from SEMS Administrator: Dashboard data not refreshing	f	2026-01-10 10:18:18.616
cmk86mxen000198qm8zjyf1n3	cmk85je6o0000hgqmu28yx89d	1	admin-response	Admin has responded to your ticket	f	2026-01-10 10:48:53.663
cmk86vrq0000398qmswkd4lxo	cmk86vlko000298qm4x300cfo	1	ticket-created	New ticket from SEMS Administrator: Application is too slow	f	2026-01-10 10:55:46.2
cmk89etod000998qmp0smtgsj	cmk86vlko000298qm4x300cfo	2	admin-response	Admin has responded to your ticket	f	2026-01-10 12:06:34.429
cmk87ls4d000798qme02o9azd	cmk87l4pc000698qmyf4asbks	1	ticket-created	New ticket from SEMS Administrator: Not receiving email alerts	t	2026-01-10 11:15:59.773
cmk86z300000598qm1wzlkoub	cmk86vlko000298qm4x300cfo	1	admin-response	Admin has responded to your ticket	t	2026-01-10 10:58:20.784
cmk89uttm000a98qmb2btnf21	cmk86vlko000298qm4x300cfo	2	ticket-updated	Your ticket status has been updated to: resolved	t	2026-01-10 12:19:01.113
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."User" (id, email, "fullName", phone, password, "licenseNumber", specialization, theme, language, "defaultDoseUnit", "autoLock", "autoLockMinutes", "isActive", "lastLogin", "roleId", "createdAt", "updatedAt") FROM stdin;
1	admin@sems.local	SEMS Administrator	\N	$2b$10$jaH.cxwqSaVvzhIFv9F9jepBEpklBXtN.uq2a33UyA3TY1YVk7FmO	ADMIN-001	System Administration	auto	en	mg	f	15	t	2026-01-10 11:42:28.604	1	2026-01-06 11:46:42.124	2026-01-10 11:42:28.608
2	pharmacist@sems.local	Sample Pharmacist	\N	$2b$10$EWqAr4VknopZwbZ1msPvA.4jCutpzjYoRQdYGO5W3m4ZIx5ANh8fW	PHARM-001	General Pharmacy	auto	en	mg	f	15	t	2026-01-10 12:19:26.555	2	2026-01-06 11:46:42.282	2026-01-10 12:19:26.557
\.


--
-- Data for Name: _PermissionToRole; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public."_PermissionToRole" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: sems
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
8735844a-21db-4687-a051-1a6077776217	e86748ccb1c9e26683f6637fbe2ffa970a1c05f9560deb59915787884514d451	2026-01-06 11:46:23.430468+00	20251219104611_add_dispense_records	\N	\N	2026-01-06 11:46:23.235877+00	1
83196ff1-3387-4bf6-96a2-924be69c188d	3a087cf4a513c5afd5dee6fbf5f738c718656b41b1b4f425012d2736c59eddc3	2026-01-06 11:46:23.479814+00	20251220_add_master_data_tables	\N	\N	2026-01-06 11:46:23.431295+00	1
bced79a5-d9e1-49a0-974f-336d68932412	db51ac0c53ba19bdbb089c5323851210766593156ff950dfea83726c846ce50d	2026-01-09 15:43:23.223708+00	add_patient_phone_number	\N	\N	2026-01-09 15:43:23.159567+00	1
\.


--
-- Name: ActivityLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sems
--

SELECT pg_catalog.setval('public."ActivityLog_id_seq"', 50, true);


--
-- Name: ApiKey_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sems
--

SELECT pg_catalog.setval('public."ApiKey_id_seq"', 1, false);


--
-- Name: DispenseRecord_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sems
--

SELECT pg_catalog.setval('public."DispenseRecord_id_seq"', 18, true);


--
-- Name: Permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sems
--

SELECT pg_catalog.setval('public."Permission_id_seq"', 1, false);


--
-- Name: PrinterSettings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sems
--

SELECT pg_catalog.setval('public."PrinterSettings_id_seq"', 1, false);


--
-- Name: Printer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sems
--

SELECT pg_catalog.setval('public."Printer_id_seq"', 1, false);


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sems
--

SELECT pg_catalog.setval('public."Role_id_seq"', 3, true);


--
-- Name: SystemSettings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sems
--

SELECT pg_catalog.setval('public."SystemSettings_id_seq"', 1, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sems
--

SELECT pg_catalog.setval('public."User_id_seq"', 2, true);


--
-- Name: ActivityLog ActivityLog_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_pkey" PRIMARY KEY (id);


--
-- Name: ApiKey ApiKey_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."ApiKey"
    ADD CONSTRAINT "ApiKey_pkey" PRIMARY KEY (id);


--
-- Name: DispenseRecord DispenseRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."DispenseRecord"
    ADD CONSTRAINT "DispenseRecord_pkey" PRIMARY KEY (id);


--
-- Name: DoseRegimen DoseRegimen_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."DoseRegimen"
    ADD CONSTRAINT "DoseRegimen_pkey" PRIMARY KEY (id);


--
-- Name: Drug Drug_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."Drug"
    ADD CONSTRAINT "Drug_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: PrintTemplate PrintTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."PrintTemplate"
    ADD CONSTRAINT "PrintTemplate_pkey" PRIMARY KEY (id);


--
-- Name: PrinterSettings PrinterSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."PrinterSettings"
    ADD CONSTRAINT "PrinterSettings_pkey" PRIMARY KEY (id);


--
-- Name: Printer Printer_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."Printer"
    ADD CONSTRAINT "Printer_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: SMTPSettings SMTPSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."SMTPSettings"
    ADD CONSTRAINT "SMTPSettings_pkey" PRIMARY KEY (id);


--
-- Name: SystemSettings SystemSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."SystemSettings"
    ADD CONSTRAINT "SystemSettings_pkey" PRIMARY KEY (id);


--
-- Name: TicketNote TicketNote_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."TicketNote"
    ADD CONSTRAINT "TicketNote_pkey" PRIMARY KEY (id);


--
-- Name: TicketNotification TicketNotification_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."TicketNotification"
    ADD CONSTRAINT "TicketNotification_pkey" PRIMARY KEY (id);


--
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _PermissionToRole _PermissionToRole_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."_PermissionToRole"
    ADD CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ActivityLog_action_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "ActivityLog_action_idx" ON public."ActivityLog" USING btree (action);


--
-- Name: ActivityLog_createdAt_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "ActivityLog_createdAt_idx" ON public."ActivityLog" USING btree ("createdAt");


--
-- Name: ActivityLog_resource_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "ActivityLog_resource_idx" ON public."ActivityLog" USING btree (resource);


--
-- Name: ActivityLog_userId_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "ActivityLog_userId_idx" ON public."ActivityLog" USING btree ("userId");


--
-- Name: ApiKey_key_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "ApiKey_key_idx" ON public."ApiKey" USING btree (key);


--
-- Name: ApiKey_key_key; Type: INDEX; Schema: public; Owner: sems
--

CREATE UNIQUE INDEX "ApiKey_key_key" ON public."ApiKey" USING btree (key);


--
-- Name: ApiKey_userId_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "ApiKey_userId_idx" ON public."ApiKey" USING btree ("userId");


--
-- Name: DispenseRecord_createdAt_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "DispenseRecord_createdAt_idx" ON public."DispenseRecord" USING btree ("createdAt");


--
-- Name: DispenseRecord_drugId_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "DispenseRecord_drugId_idx" ON public."DispenseRecord" USING btree ("drugId");


--
-- Name: DispenseRecord_externalId_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "DispenseRecord_externalId_idx" ON public."DispenseRecord" USING btree ("externalId");


--
-- Name: DispenseRecord_externalId_key; Type: INDEX; Schema: public; Owner: sems
--

CREATE UNIQUE INDEX "DispenseRecord_externalId_key" ON public."DispenseRecord" USING btree ("externalId");


--
-- Name: DispenseRecord_userId_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "DispenseRecord_userId_idx" ON public."DispenseRecord" USING btree ("userId");


--
-- Name: DoseRegimen_ageGroup_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "DoseRegimen_ageGroup_idx" ON public."DoseRegimen" USING btree ("ageGroup");


--
-- Name: DoseRegimen_drugId_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "DoseRegimen_drugId_idx" ON public."DoseRegimen" USING btree ("drugId");


--
-- Name: Drug_category_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "Drug_category_idx" ON public."Drug" USING btree (category);


--
-- Name: Drug_genericName_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "Drug_genericName_idx" ON public."Drug" USING btree ("genericName");


--
-- Name: Permission_name_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "Permission_name_idx" ON public."Permission" USING btree (name);


--
-- Name: Permission_name_key; Type: INDEX; Schema: public; Owner: sems
--

CREATE UNIQUE INDEX "Permission_name_key" ON public."Permission" USING btree (name);


--
-- Name: PrintTemplate_isDefault_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "PrintTemplate_isDefault_idx" ON public."PrintTemplate" USING btree ("isDefault");


--
-- Name: PrintTemplate_name_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "PrintTemplate_name_idx" ON public."PrintTemplate" USING btree (name);


--
-- Name: PrinterSettings_printerId_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "PrinterSettings_printerId_idx" ON public."PrinterSettings" USING btree ("printerId");


--
-- Name: PrinterSettings_printerId_key; Type: INDEX; Schema: public; Owner: sems
--

CREATE UNIQUE INDEX "PrinterSettings_printerId_key" ON public."PrinterSettings" USING btree ("printerId");


--
-- Name: Printer_ipAddress_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "Printer_ipAddress_idx" ON public."Printer" USING btree ("ipAddress");


--
-- Name: Printer_isDefault_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "Printer_isDefault_idx" ON public."Printer" USING btree ("isDefault");


--
-- Name: Printer_name_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "Printer_name_idx" ON public."Printer" USING btree (name);


--
-- Name: Role_name_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "Role_name_idx" ON public."Role" USING btree (name);


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: sems
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: SystemSettings_facilityName_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "SystemSettings_facilityName_idx" ON public."SystemSettings" USING btree ("facilityName");


--
-- Name: TicketNote_ticketId_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "TicketNote_ticketId_idx" ON public."TicketNote" USING btree ("ticketId");


--
-- Name: TicketNote_userId_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "TicketNote_userId_idx" ON public."TicketNote" USING btree ("userId");


--
-- Name: TicketNotification_read_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "TicketNotification_read_idx" ON public."TicketNotification" USING btree (read);


--
-- Name: TicketNotification_ticketId_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "TicketNotification_ticketId_idx" ON public."TicketNotification" USING btree ("ticketId");


--
-- Name: TicketNotification_userId_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "TicketNotification_userId_idx" ON public."TicketNotification" USING btree ("userId");


--
-- Name: Ticket_priority_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "Ticket_priority_idx" ON public."Ticket" USING btree (priority);


--
-- Name: Ticket_status_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "Ticket_status_idx" ON public."Ticket" USING btree (status);


--
-- Name: Ticket_ticketNumber_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "Ticket_ticketNumber_idx" ON public."Ticket" USING btree ("ticketNumber");


--
-- Name: Ticket_ticketNumber_key; Type: INDEX; Schema: public; Owner: sems
--

CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON public."Ticket" USING btree ("ticketNumber");


--
-- Name: Ticket_userId_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "Ticket_userId_idx" ON public."Ticket" USING btree ("userId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: sems
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_licenseNumber_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "User_licenseNumber_idx" ON public."User" USING btree ("licenseNumber");


--
-- Name: User_licenseNumber_key; Type: INDEX; Schema: public; Owner: sems
--

CREATE UNIQUE INDEX "User_licenseNumber_key" ON public."User" USING btree ("licenseNumber");


--
-- Name: User_roleId_idx; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "User_roleId_idx" ON public."User" USING btree ("roleId");


--
-- Name: _PermissionToRole_B_index; Type: INDEX; Schema: public; Owner: sems
--

CREATE INDEX "_PermissionToRole_B_index" ON public."_PermissionToRole" USING btree ("B");


--
-- Name: ActivityLog ActivityLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApiKey ApiKey_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."ApiKey"
    ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DispenseRecord DispenseRecord_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."DispenseRecord"
    ADD CONSTRAINT "DispenseRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PrinterSettings PrinterSettings_printerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."PrinterSettings"
    ADD CONSTRAINT "PrinterSettings_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES public."Printer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketNote TicketNote_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."TicketNote"
    ADD CONSTRAINT "TicketNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketNote TicketNote_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."TicketNote"
    ADD CONSTRAINT "TicketNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TicketNotification TicketNotification_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."TicketNotification"
    ADD CONSTRAINT "TicketNotification_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketNotification TicketNotification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."TicketNotification"
    ADD CONSTRAINT "TicketNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ticket Ticket_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _PermissionToRole _PermissionToRole_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."_PermissionToRole"
    ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _PermissionToRole _PermissionToRole_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sems
--

ALTER TABLE ONLY public."_PermissionToRole"
    ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO sems;


--
-- PostgreSQL database dump complete
--

\unrestrict dZ54NzGfidr5DLKvBGenIJEnDhVPyximmM7uUbPe2vgn6F7gQm4eoykyOzFO33h


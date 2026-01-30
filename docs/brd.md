# Business Requirements Document (BRD)
# Document Purpose

This document defines the requirements for CallTrack system, a call activity tracking and analytics platform designed for organizations that rely on phone-based sales and marketing activities.
The objective of this document is to:
Clearly outline MVP scope and functionality
Reduce implementation complexity
Enable faster business approval
Ensure the platform remains scalable for future enhancements
# Business Problem Statement

Organizations face limited visibility into outbound and inbound calling activities done by field and sales teams using official mobile phones.
Key challenges include:
Inaccurate or manual call reporting
Calls deleted from phones without trace
No clear separation of business vs personal calls
Limited actionable insights for managers
Difficulty integrating call data with CRM systems
# Business Objectives

This phase aims to:
Automatically capture all call activity from registered Android devices
Ensure call data integrity and auditability
Provide admins with clear call analytics
Enable admin-only classification of calls
Support future CRM integration
Maintain user privacy and compliance
# User Roles

4.1 Admin
Manages devices and agents
Views all call logs and reports
Classifies calls (business / personal / ignored)
Manages basic contacts
Controls CRM integrations (future)
Exports reports
4.2 Agent
Uses the registered Android device
Does not log in with credentials
Has no access to analytics or classification
Cannot modify or delete call data
Note:
Agents are not given dashboards or reporting access in this phase.
# In-Scope & Out-of-Scope (MVP)

In Scope
Android call tracking app
Admin web interface (Laravel)
Device registration & lifecycle management
Call log ingestion and storage
Admin-only call categorization
Basic contact saving from call logs
Dashboards & reports for Admin
Role-based access (Admin, Agent)
CRM-ready architecture (no active integrations)
Out of Scope
Call recording
iOS support
Multi-level admin roles
Agent-facing dashboards
CRM integrations
Advanced AI insights
# Mobile Application Requirements (Agent)

6.1 Device Registration
Admin generates a one-time device registration code
Agent enters the code in the Android app
Device is securely registered and activated
No username/password login required
6.2 Call Data Capture
The app will automatically capture:
Incoming, outgoing, and missed calls
Call start and end time
Call duration
SIM slot used
Phone contact name
Device identifier
All calls are captured without user intervention.
6.3 Call Deletion Handling
Call data is captured immediately at call end
Deleting calls on the phone does not remove server data
Ensures complete and auditable call history
6.4 Agent Limitations
Agents:
Cannot categorize calls
Cannot delete or edit call logs
Cannot access reports
Cannot disable tracking without admin action
# Admin Web Application Requirements

7.1 Call Logs & Classification
Admins can:
View all call logs
Classify calls as:
Business
Personal
Ignored
Reclassify calls if needed
Maintain audit history
7.2 Contact Management (Lightweight)
Save unknown numbers as contacts
Attach notes and tags
Prepare contacts for future CRM sync
7.3 Device Management
Admins can:
Add and register devices
Assign devices to agents
Suspend or revoke devices
View device health and last sync status
# Reporting & Dashboards (Admin)

Default Metrics:
Total calls
Business calls
Call duration
Agent-wise activity
Daily / weekly trends
Only business-classified calls are included by default.
# CRM Integration Readiness

The platform is designed to integrate with CRM systems via APIs
CRM integration is not implemented in this phase
Architecture allows future CRM integrations without redesign
# Security, Privacy & Compliance

No call audio recording
No syncing of the full personal phone contact book (only caller names for logged calls are captured)
Secure device token authentication
Admin-controlled access
Full audit trail of call classifications

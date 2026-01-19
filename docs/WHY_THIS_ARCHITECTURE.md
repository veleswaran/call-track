# Why this Architecture? (Altalya Standards)

You might be wondering: *"Why can't I just put this logic in the Controller? It's just a simple update."*


This document explains **why** we follow strictly layered architecture and how it solves problems that eventually kill "Standard Laravel" projects.

## 🥊 The Comparison

| Feature | Standard Laravel ("The Laravel Way") | Altalya Standards (Strict Layers) |
| :--- | :--- | :--- |
| **Logic Location** | Mixed in Controllers, Models, and Observers. | strictly in **Actions**. Orchestrated by **Services**. |
| **Controllers** | Often "Fat". Contain validation, queries, and logic. | **Skinny**. Only handle HTTP (Request $\to$ Service $\to$ Response). |
| **Models** | "God Classes". Full of methods, accessors, and side-effects. | **Passive**. Only definitions, relationships, and casts. |
| **Data Flow** | `$request->all()` (Unsafe, implicit arrays). | **DTOs** (Typed, explicit, immutable objects). |
| **Testing** | Hard. Requires DB for everything. Hard to mock "fat" models. | **Easy**. Unit test Actions in isolation. Mock Interfaces in Controllers. |
| **Refactoring** | **High Risk**. Changing a model method breaks 5 unrelated controllers. | **Low Risk**. Actions are isolated. Services are contracted. |

---

## 🛑 The Problem with "Standard" Laravel

In a small demo, standard Laravel is faster. But in an enterprise system, it hits a wall:

1.  **The "Fat Controller" Problem**:
    *   You start with 5 lines.
    *   Then you add email notifications.
    *   Then you add logging.
    *   Then you add a conditional check for calling an external API.
    *   Suddenly, your Controller is 200 lines long and impossible to test without spinning up the whole world.

2.  **The "God Model" Problem**:
    *   You add a method `User::activiate()` to the Model.
    *   Then you add `User::sendWelcomeEmail()`.
    *   Then you add `User::calculateMonthlyStats()`.
    *   Your `User` class becomes a dumping ground for *everything* related to a user. It violates the Single Responsibility Principle.

3.  **The Array Trap**:
    *   Passing `$request->all()` or associative arrays `$data['user_id']` is easy but dangerous.
    *   "What keys are in this array?" -> You have to read the code to find out.
    *   "Is `user_id` an int or a string?" -> Who knows?
    *   **DTOs** solve this. You know exactly what data you have, and your IDE helps you.

---

## ✅ The Benefits of Strict Layers

### 1. 🧪 Testability
*   **Actions**: Pure PHP classes. Input $\to$ Output. No HTTP request needed. fast unit tests.
*   **Services**: Can be mocked. When testing a Controller, you don't need to test the Service logic again. You just test that the *Controller calls the Service*.

### 2. 🛡 Stability
*   If you need to change how users are updated, you edit `UpdateUserAction`.
*   You don't touch the Controller.
*   You don't touch the Model.
*   The generic `Action` doesn't care if it was called from an API, a CLI command, or a background Job. It just works.

### 3. 🤖 AI & Team Scalability
*   Strict rules mean **predictability**.
*   A new developer (or an AI agent) knows *exactly* where to put code.
    *   "Is it validation?" $\to$ **Request**.
    *   "Is it business logic?" $\to$ **Action**.
    *   "Is it a query?" $\to$ **Model Scope** or **Service**.
*   There are no "judgement calls" about structure, which reduces code review friction.

---

## 💡 Summary

We pay a small "tax" upfront (creating DTOs, Interfaces, Service classes) to buy **infinite maintainability** later.

> **"Slow down now to speed up later."**

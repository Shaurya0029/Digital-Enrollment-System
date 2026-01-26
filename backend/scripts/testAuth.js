(async () => {
  const base = "http://localhost:5000";
  try {
    let r = await fetch(base + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Admin",
        email: "hr@example.com",
        password: "password123",
      }),
    });
    console.log("register status", r.status);
    try {
      console.log(await r.json());
    } catch (e) {}

    r = await fetch(base + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "hr@example.com",
        password: "password123",
      }),
    });
    console.log("login status", r.status);
    const data = await r.json().catch(() => null);
    console.log("login body", data);

    if (data && data.token) {
      const token = data.token;
      r = await fetch(base + "/hr/employees", {
        headers: { Authorization: "Bearer " + token },
      });
      console.log("/hr/employees status", r.status);
      console.log("employees:", await r.json().catch(() => null));
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

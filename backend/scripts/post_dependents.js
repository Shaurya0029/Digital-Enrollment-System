(async () => {
  const url = "http://localhost:5000/dependents";
  const token = "mocktoken";
  for (let i = 1; i <= 3; i++) {
    const body = { name: `node-dep-${i}`, relation: "child", employeeId: 3 };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      console.log(`POST ${i} -> status ${res.status} body: ${text}`);
    } catch (err) {
      console.error(`POST ${i} error:`, err.message || err);
    }
    await new Promise((r) => setTimeout(r, 800));
  }
})();

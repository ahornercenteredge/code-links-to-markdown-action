SELECT *
FROM customers
WHERE lastupdate >= DATEADD(DAY, -1, GETDATE())
/* ==============================================================
   INFT3050 — Additional test data for StoreDB
   --------------------------------------------------------------
   Target: Microsoft SQL Server (StoreDB)
   Purpose: adds accounts with KNOWN passwords plus a small,
            self-contained set of products and orders.

   Run with:
     docker exec -i <db-container> /opt/mssql-tools18/bin/sqlcmd \
       -C -S localhost -U sa -P inft3050_ -d StoreDB -i seed-test-data.sql

   Safe to re-run: every insert is guarded by an existence check.
   Rollback: see the DELETE block at the end (commented out).
   ============================================================== */

USE [StoreDB];
GO

SET NOCOUNT ON;
GO

/* --------------------------------------------------------------
   1. Staff accounts  (User.UserName is the PRIMARY KEY)
   Passwords: devadmin / Admin123!   devstaff / Staff123!
   HashPW = SHA256(Salt + password)
   -------------------------------------------------------------- */

IF NOT EXISTS (SELECT 1 FROM [dbo].[User] WHERE [UserName] = N'devadmin')
INSERT INTO [dbo].[User] ([UserName], [Email], [Name], [isAdmin], [Salt], [HashPW])
VALUES (N'devadmin', N'devadmin@test.com', N'Dev Admin', 1,
        N'62ad562a84921840f502e53b75384ab1',
        N'c2290e6801891cc2eec4c3f205802fb52c00d80470f9e41146be182671bd7931');

IF NOT EXISTS (SELECT 1 FROM [dbo].[User] WHERE [UserName] = N'devstaff')
INSERT INTO [dbo].[User] ([UserName], [Email], [Name], [isAdmin], [Salt], [HashPW])
VALUES (N'devstaff', N'devstaff@test.com', N'Dev Staff', 0,
        N'cfb29c241880f8adf3a03e822f67ad71',
        N'cee2e1aab5af2cce60f339dcbeafced914f3ff79ba45fcea7587551b1d95d854');
GO

/* --------------------------------------------------------------
   2. Patrons (customers) — password for all three: Test123!
   Email acts as the username.
   -------------------------------------------------------------- */

IF NOT EXISTS (SELECT 1 FROM [dbo].[Patrons] WHERE [Email] = N'alice@test.com')
INSERT INTO [dbo].[Patrons] ([Email], [Name], [Salt], [HashPW])
VALUES (N'alice@test.com', N'Alice Nguyen',
        N'08ffecfb0e6aea20db31f18a921fbef2',
        N'abab2034983dc2923c53efe2047555a3949869002613712e1cdb826671309680');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Patrons] WHERE [Email] = N'bob@test.com')
INSERT INTO [dbo].[Patrons] ([Email], [Name], [Salt], [HashPW])
VALUES (N'bob@test.com', N'Bob Tran',
        N'0f34923eec9dd985d7ca2d26787d88d4',
        N'0582485895da3449f22fb743949fb04cd9e8a85b3ecd995be24d4b7fea6b917f');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Patrons] WHERE [Email] = N'carol@test.com')
INSERT INTO [dbo].[Patrons] ([Email], [Name], [Salt], [HashPW])
VALUES (N'carol@test.com', N'Carol White',
        N'bea4b4acd32029f9ee9f03f6d85cd9cc',
        N'800c2456a44a4d3479f404078cb1ef26e0bc0040bbcce32e1bc9e85cc59b4361');
GO

/* --------------------------------------------------------------
   3. Products — one per genre.
   ID is IDENTITY, so let SQL Server assign it and capture the value.
   LastUpdatedBy is an FK to User.UserName — must be a real username.
   -------------------------------------------------------------- */

DECLARE @bookId INT, @movieId INT, @gameId INT;

IF NOT EXISTS (SELECT 1 FROM [dbo].[Product] WHERE [Name] = N'The Silent Archive')
BEGIN
    INSERT INTO [dbo].[Product]
        ([Name], [Author], [Description], [Genre], [subGenre], [Published], [LastUpdatedBy], [LastUpdated])
    VALUES (N'The Silent Archive', N'M. Rothwell',
            N'A archivist uncovers a cache of letters that rewrites a town''s history.',
            1, 7, CAST(N'2019-04-12' AS DATE), N'storeManager', GETDATE());
    SET @bookId = SCOPE_IDENTITY();
END
ELSE SELECT @bookId = [ID] FROM [dbo].[Product] WHERE [Name] = N'The Silent Archive';

IF NOT EXISTS (SELECT 1 FROM [dbo].[Product] WHERE [Name] = N'Harbour Lights')
BEGIN
    INSERT INTO [dbo].[Product]
        ([Name], [Author], [Description], [Genre], [subGenre], [Published], [LastUpdatedBy], [LastUpdated])
    VALUES (N'Harbour Lights', N'Ines Duarte',
            N'Two dockworkers on opposite sides of a strike over one long summer.',
            2, 3, CAST(N'2021-11-05' AS DATE), N'storeManager', GETDATE());
    SET @movieId = SCOPE_IDENTITY();
END
ELSE SELECT @movieId = [ID] FROM [dbo].[Product] WHERE [Name] = N'Harbour Lights';

IF NOT EXISTS (SELECT 1 FROM [dbo].[Product] WHERE [Name] = N'Fracture Point')
BEGIN
    INSERT INTO [dbo].[Product]
        ([Name], [Author], [Description], [Genre], [subGenre], [Published], [LastUpdatedBy], [LastUpdated])
    VALUES (N'Fracture Point', N'Northwind Studios',
            N'Co-operative puzzle platformer set inside a collapsing space station.',
            3, 6, CAST(N'2023-06-30' AS DATE), N'devadmin', GETDATE());
    SET @gameId = SCOPE_IDENTITY();
END
ELSE SELECT @gameId = [ID] FROM [dbo].[Product] WHERE [Name] = N'Fracture Point';

/* --------------------------------------------------------------
   4. Stocktake — price + availability.
   Streaming sources use Quantity = 100 per the data dictionary.
   -------------------------------------------------------------- */

IF NOT EXISTS (SELECT 1 FROM [dbo].[Stocktake] WHERE [ProductId] = @bookId)
INSERT INTO [dbo].[Stocktake] ([SourceId], [ProductId], [Quantity], [Price]) VALUES
    (1, @bookId,  24, 32.95),   -- Hard copy book
    (2, @bookId, 100, 18.50);   -- Audible

IF NOT EXISTS (SELECT 1 FROM [dbo].[Stocktake] WHERE [ProductId] = @movieId)
INSERT INTO [dbo].[Stocktake] ([SourceId], [ProductId], [Quantity], [Price]) VALUES
    (4, @movieId, 100,  6.99),  -- Prime Video
    (5, @movieId,  12, 24.00);  -- DVD

IF NOT EXISTS (SELECT 1 FROM [dbo].[Stocktake] WHERE [ProductId] = @gameId)
INSERT INTO [dbo].[Stocktake] ([SourceId], [ProductId], [Quantity], [Price]) VALUES
    (3, @gameId, 100, 79.95);   -- Steam
GO

/* --------------------------------------------------------------
   5. Two complete orders.
   Order 1: registered patron (Alice)  -> TO.PatronId set
   Order 2: guest checkout             -> TO.PatronId NULL
   Note CardNumber/CVV are dummy values; the schema stores them in
   plain text, which is a documented limitation, not a design choice.
   -------------------------------------------------------------- */

DECLARE @alice INT, @txn1 INT, @txn2 INT, @ord1 INT, @ord2 INT, @item INT;

SELECT @alice = [UserID] FROM [dbo].[Patrons] WHERE [Email] = N'alice@test.com';

IF NOT EXISTS (SELECT 1 FROM [dbo].[TO] WHERE [Email] = N'alice@test.com')
BEGIN
    INSERT INTO [dbo].[TO]
        ([PatronId], [Email], [PhoneNumber], [StreetAddress], [PostCode], [Suburb], [State],
         [CardNumber], [CardOwner], [Expiry], [CVV])
    VALUES (@alice, N'alice@test.com', N'0400111222', N'12 Wattle St', 2000, N'Sydney', N'NSW',
            N'4111111111111111', N'Alice Nguyen', N'08/28', 123);
    SET @txn1 = SCOPE_IDENTITY();

    INSERT INTO [dbo].[Orders] ([customer], [StreetAddress], [PostCode], [Suburb], [State])
    VALUES (@txn1, N'12 Wattle St', 2000, N'Sydney', N'NSW');
    SET @ord1 = SCOPE_IDENTITY();

    -- Line items reference Stocktake.ItemId, NOT Product.ID
    SELECT TOP 1 @item = [ItemId] FROM [dbo].[Stocktake]
     WHERE [ProductId] = (SELECT [ID] FROM [dbo].[Product] WHERE [Name] = N'The Silent Archive');
    INSERT INTO [dbo].[ProductsInOrders] ([OrderId], [produktId], [Quantity]) VALUES (@ord1, @item, 2);

    SELECT TOP 1 @item = [ItemId] FROM [dbo].[Stocktake]
     WHERE [ProductId] = (SELECT [ID] FROM [dbo].[Product] WHERE [Name] = N'Fracture Point');
    INSERT INTO [dbo].[ProductsInOrders] ([OrderId], [produktId], [Quantity]) VALUES (@ord1, @item, 1);
END

IF NOT EXISTS (SELECT 1 FROM [dbo].[TO] WHERE [Email] = N'guest.buyer@test.com')
BEGIN
    INSERT INTO [dbo].[TO]
        ([PatronId], [Email], [PhoneNumber], [StreetAddress], [PostCode], [Suburb], [State],
         [CardNumber], [CardOwner], [Expiry], [CVV])
    VALUES (NULL, N'guest.buyer@test.com', N'0433444555', N'88 Rundle Mall', 5000, N'Adelaide', N'SA',
            N'5555555555554444', N'Guest Buyer', N'01/29', 456);
    SET @txn2 = SCOPE_IDENTITY();

    INSERT INTO [dbo].[Orders] ([customer], [StreetAddress], [PostCode], [Suburb], [State])
    VALUES (@txn2, N'88 Rundle Mall', 5000, N'Adelaide', N'SA');
    SET @ord2 = SCOPE_IDENTITY();

    SELECT TOP 1 @item = [ItemId] FROM [dbo].[Stocktake]
     WHERE [ProductId] = (SELECT [ID] FROM [dbo].[Product] WHERE [Name] = N'Harbour Lights');
    INSERT INTO [dbo].[ProductsInOrders] ([OrderId], [produktId], [Quantity]) VALUES (@ord2, @item, 3);
END
GO

/* --------------------------------------------------------------
   6. Verify
   -------------------------------------------------------------- */

SELECT 'User'    AS [Table], COUNT(*) AS [Rows] FROM [dbo].[User]
UNION ALL SELECT 'Patrons',          COUNT(*) FROM [dbo].[Patrons]
UNION ALL SELECT 'Product',          COUNT(*) FROM [dbo].[Product]
UNION ALL SELECT 'Stocktake',        COUNT(*) FROM [dbo].[Stocktake]
UNION ALL SELECT 'TO',               COUNT(*) FROM [dbo].[TO]
UNION ALL SELECT 'Orders',           COUNT(*) FROM [dbo].[Orders]
UNION ALL SELECT 'ProductsInOrders', COUNT(*) FROM [dbo].[ProductsInOrders];
GO

/* --------------------------------------------------------------
   7. Rollback — uncomment to remove everything this script added.
      Delete in FK-dependency order.
   --------------------------------------------------------------
DELETE pio FROM [dbo].[ProductsInOrders] pio
  JOIN [dbo].[Orders] o ON o.[OrderID] = pio.[OrderId]
  JOIN [dbo].[TO] t ON t.[customerID] = o.[customer]
 WHERE t.[Email] IN (N'alice@test.com', N'guest.buyer@test.com');

DELETE o FROM [dbo].[Orders] o
  JOIN [dbo].[TO] t ON t.[customerID] = o.[customer]
 WHERE t.[Email] IN (N'alice@test.com', N'guest.buyer@test.com');

DELETE FROM [dbo].[TO] WHERE [Email] IN (N'alice@test.com', N'guest.buyer@test.com');

DELETE FROM [dbo].[Stocktake]
 WHERE [ProductId] IN (SELECT [ID] FROM [dbo].[Product]
                        WHERE [Name] IN (N'The Silent Archive', N'Harbour Lights', N'Fracture Point'));

DELETE FROM [dbo].[Product]
 WHERE [Name] IN (N'The Silent Archive', N'Harbour Lights', N'Fracture Point');

DELETE FROM [dbo].[Patrons]
 WHERE [Email] IN (N'alice@test.com', N'bob@test.com', N'carol@test.com');

DELETE FROM [dbo].[User] WHERE [UserName] IN (N'devadmin', N'devstaff');
GO
*/

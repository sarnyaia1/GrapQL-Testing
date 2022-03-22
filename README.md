# Integrációs tesztelés (GraphQL)

Az Apollo Server egy többlépcsős kérésfolyamatot használ a bejövő GraphQL-műveletek érvényesítésére és végrehajtására. Ez a folyamat minden lépésben támogatja az egyéni beépülő modulokkal való integrációt, ami befolyásolhatja a művelet végrehajtását. Emiatt fontos, hogy különféle műveleteket tartalmazó integrációs teszteket hajtson végre annak biztosítása érdekében, hogy a kérésfolyamat a várt módon működjön. 

## Két fő lehetőség van az Apollo Server integrációs tesztelésére:
-	Az ApolloServer executeOperation metódusának használata.
-	HTTP-kliens beállítása a szerver lekérdezéséhez.

### Tesztelés az executeOperation használatával
Az Apollo Server executeOperation metódusa lehetővé teszi a műveletek futtatását a kérési folyamaton keresztül HTTP-kérés küldése nélkül.
Az executeOperation metódus a következő argumentumokat fogadja el:
1.	Egy objektum, amely leírja a végrehajtandó GraphQL műveletet. Ennek az objektumnak tartalmaznia kell egy lekérdezési(query) mezőt, amely megadja a futtatandó GraphQL műveletet. Az executeOperation segítségével lekérdezéseket és mutációkat is végrehajthat, de mindkettő a lekérdezés (query) mezőt használja.
2.	Egy opcionális argumentum, amely az ApolloServer környezetfüggvényébe kerül. Az alábbiakban egy egyszerűsített példa látható a teszt beállítására a Jest JavaScript tesztelési könyvtár használatával:

```
// For clarity in this example we included our typeDefs and resolvers above our test,
// but in a real world situation you'd be importing these in from different files

const typeDefs = gql`
  type Query {
    hello(name: String): String!
  }
`;

const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name}!`,
  },
};

it('returns hello with the provided name', async () => {
  const testServer = new ApolloServer({
    typeDefs,
    resolvers
  });

  const result = await testServer.executeOperation({
    query: 'query SayHelloWorld($name: String) { hello(name: $name) }',
    variables: { name: 'world' },
  });

  expect(result.errors).toBeUndefined();
  expect(result.data?.hello).toBe('Hello world!');
});
```

A tesztelés során a GraphQL művelet elemzése, érvényesítése és végrehajtása során fellépő hibák a művelet eredményének hibamezőjében jelennek meg. Az Apollo Server normál példányaitól eltérően az executeOperation meghívása előtt nem szükséges a start funkció. Automatikusan meghívódik, és ha esetleg hiba van akkor azonnal visszajelzést kapunk.  Itt egy teljes integrációs tesztet futtatunk az ApolloServer tesztpéldányán. Ez a teszt importálja az összes fontos tesztelendő elemet (typeDefs, resolvers, dataSources), és létrehozza az ApolloServer új példányát.

```
it('fetches single launch', async () => {
  const userAPI = new UserAPI({ store });
  const launchAPI = new LaunchAPI();

  // create a test server to test against, using our production typeDefs,
  // resolvers, and dataSources.
  
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => ({ userAPI, launchAPI }),
    context: () => ({ user: { id: 1, email: 'a@a.a' } }),
  });

  // mock the dataSource's underlying fetch methods
  launchAPI.get = jest.fn(() => [mockLaunchResponse]);
  userAPI.store = mockStore;
  userAPI.store.trips.findAll.mockReturnValueOnce([
    { dataValues: { launchId: 1 } },
  ]);

  // run the query against the server and snapshot the output
  const res = await server.executeOperation({ query: GET_LAUNCH, variables: { id: 1 } });
  expect(res).toMatchSnapshot();
});
```

A fenti példa egy tesztspecifikus context függvényt tartalmaz, amely közvetlenül az ApolloServer-példánynak szolgáltat adatokat ahelyett, hogy a kérés környezetéből számítaná ki azokat. A szerver definiált context függvényének használatához átadhatunk egy második argumentumot az executeOperationnek, amely azután a kiszolgáló context függvényéhez kerül. A kiszolgáló környezetfüggvényének használatához össze kell állítanunk egy objektumot a megfelelő köztesszoftver-specifikus környezeti mezőkkel (middleware-specific context fields) a megvalósításhoz.

### End-to-end testing
A HTTP-réteg megkerülése helyett érdemes lehet teljesen futtatni a szervert, és tesztelni egy valódi HTTP-klienssel. Az Apollo Server jelenleg nem nyújt beépített támogatást ehhez. Bármely HTTP- vagy GraphQL-kliens, például a supertest vagy az Apollo Client HTTP-link kombinációjával futtathatunk műveleteket a szerveren. Vannak közösségi csomagok is, mint például az apollo-server-integration-testing, amely mocked Express kérést és válasz objektumokat használ. Az alábbiakban egy példa egy végpontok közötti teszt megírására az Apollo-server csomag és a szuperteszt használatával:

```
/// we import a function that we wrote to create a new instance of Apollo Server
import { createApolloServer } from '../server';

// we will use supertest to test our server
import request from 'supertest';

// this is the query we use for our test
const queryData = {
  query: `query sayHello($name: String) {
    hello(name: $name)
  }`,
  variables: { name: 'world' },
};

describe('e2e demo', () => {
  let server, url;

  // before the tests we will spin up a new Apollo Server
  beforeAll(async () => {
    // Note we must wrap our object destructuring in parentheses because we already declared these variables
    // We pass in the port as 0 to let the server pick its own ephemeral port for testing
    ({ server, url } = await createApolloServer({ port: 0 }));
  });

  // after the tests we will stop our server
  afterAll(async () => {
    await server?.close();
  });

  it('says hello', async () => {
    // send our request to the url of the test server
    const response = await request(url).post('/').send(queryData);
    expect(response.errors).toBeUndefined();
    expect(response.body.data?.hello).toBe('Hello world!');
  });
});
```
import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {SqlServerDriver} from "../../../../src/driver/sqlserver/SqlServerDriver";

describe("query builder > update", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should perform updation correctly", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "Alex Messer";

        await connection.manager.save(user);

        await connection.createQueryBuilder()
            .update(User)
            .set({ name: "Dima Zotov" })
            .where("name = :name", { name: "Alex Messer" })
            .execute();

        const loadedUser1 = await connection.getRepository(User).findOne({ name: "Dima Zotov" });
        expect(loadedUser1).to.exist;
        loadedUser1!.name.should.be.equal("Dima Zotov");

        await connection.getRepository(User)
            .createQueryBuilder("myUser")
            .update()
            .set({ name: "Muhammad Mirzoev" })
            .where("name = :name", { name: "Dima Zotov" })
            .execute();

        const loadedUser2 = await connection.getRepository(User).findOne({ name: "Muhammad Mirzoev" });
        expect(loadedUser2).to.exist;
        loadedUser2!.name.should.be.equal("Muhammad Mirzoev");

    })));

    it("should be able to use sql functions", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "Alex Messer";

        await connection.manager.save(user);

        await connection.createQueryBuilder()
            .update(User)
            .set({ name: () => connection.driver instanceof SqlServerDriver ? "SUBSTRING('Dima Zotov', 1, 4)" : "SUBSTR('Dima Zotov', 1, 4)" })
            .where("name = :name", { name: () => connection.driver instanceof SqlServerDriver ? "SUBSTRING('Alex Messer Dimovich', 1, 11)" : "SUBSTR('Alex Messer Dimovich', 1, 11)" })
            .execute();

        const loadedUser1 = await connection.getRepository(User).findOne({ name: "Dima" });
        expect(loadedUser1).to.exist;
        loadedUser1!.name.should.be.equal("Dima");

    })));

    it("should update and escape properly", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "Dima";
        user.likesCount = 1;

        await connection.manager.save(user);

        const qb = connection.createQueryBuilder();
        await qb
            .update(User)
            .set({ likesCount: () => qb.escape(`likesCount`) + " + 1" })
            // .set({ likesCount: 2 })
            .where("likesCount = 1")
            .execute();

        const loadedUser1 = await connection.getRepository(User).findOne({ likesCount: 2 });
        expect(loadedUser1).to.exist;
        loadedUser1!.name.should.be.equal("Dima");

    })));

});
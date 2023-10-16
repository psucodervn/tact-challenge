import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { toNano } from 'ton-core';
import { Task1 } from '../wrappers/Task1';
import '@ton-community/test-utils';

describe('Task1', () => {
    let blockchain: Blockchain;
    let task1: SandboxContract<Task1>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        task1 = blockchain.openContract(await Task1.fromInit());
        const deployer = await blockchain.treasury('deployer');
        const deployResult = await task1.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task1.address,
            deploy: true,
            success: true,
        });
    });

    it('test', async () => {
        expect(await task1.getCounter()).toBe(0n);
        const caller = await blockchain.treasury('caller');

        await task1.send(caller.getSender(), { value: toNano('0.05') }, { $$type: 'Add', queryId: 0n, number: 10n });
        expect(await task1.getCounter()).toBe(10n);

        await task1.send(
            caller.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Subtract', queryId: 0n, number: 5n }
        );
        expect(await task1.getCounter()).toBe(5n);

        await task1.send(
            caller.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Subtract', queryId: 0n, number: 20n }
        );
        expect(await task1.getCounter()).toBe(-15n);

        await task1.send(
            caller.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Add', queryId: 0n, number: 2_000_000_000n }
        );
        expect(await task1.getCounter()).toBe(1_999_999_985n);
    });
});

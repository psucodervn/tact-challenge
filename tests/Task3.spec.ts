import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { toNano, Address, Cell } from 'ton-core';
import { Task3 } from '../wrappers/Task3';
import '@ton-community/test-utils';

describe('Task3', () => {
    let blockchain: Blockchain;
    let task3: SandboxContract<Task3>;
    let admin: SandboxContract<TreasuryContract>;
    let tokenA: Address = Address.parseRaw('0:0000000000000000000000000000000000000000000000000000000000000001');
    let tokenB: Address = Address.parseRaw('0:0000000000000000000000000000000000000000000000000000000000000002');

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        admin = await blockchain.treasury('admin');
        task3 = blockchain.openContract(await Task3.fromInit(admin.address, tokenA, tokenB));

        const deployer = await blockchain.treasury('deployer');
        const deployResult = await task3.send(
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
            to: task3.address,
            deploy: true,
            success: true,
        });

        await task3.send(
            admin.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'TokenNotification',
                queryId: 0n,
                amount: toNano('10'),
                from: tokenA,
                forwardPayload: new Cell(),
            }
        );
        await task3.send(
            admin.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'TokenNotification',
                queryId: 0n,
                amount: toNano('2'),
                from: tokenB,
                forwardPayload: new Cell(),
            }
        );
    });

    it('test price', async () => {
        const priceA = await task3.getPrice(tokenA);
        expect(priceA).toEqual(5n * 10n ** 9n);

        const priceB = await task3.getPrice(tokenB);
        expect(priceB).toEqual(2n * 10n ** 8n);
    });
});

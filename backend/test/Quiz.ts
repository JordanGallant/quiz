import { expect } from "chai";
import { ethers } from "hardhat";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import {Quiz} from "../typechain-types";
import {
  zeroOutAddresses
} from "hardhat/internal/hardhat-network/stack-traces/library-utils";
import {ZeroAddress} from "ethers/src.ts/constants/addresses";
import {
  HardhatEthersProvider
} from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";

describe("Quiz", function () {
  async function deployQuiz() {
    const Quiz_factory = await ethers.getContractFactory("Quiz");
    const quiz = await Quiz_factory.deploy({
        value: ethers.parseEther("10.00"),
      }
    );
    await quiz.waitForDeployment();
    return { quiz };
  }

  async function addQuestions(quiz: Quiz) {
    await quiz.pushQuestion("What's the European highest peak?", ["Triglav", "Mount Everest", "Mont Blanc"], 2);
    await quiz.pushQuestion("When was the Bitcoin whitepaper published?", ["2009", "2006", "2012"], 0);
  }

  async function addCoupons(quiz: Quiz) {
    await quiz.addCoupons(["testCoupon1", "testCoupon2"]);
  }

  async function setGaslessKeypair(quiz: Quiz) {
    const addr = ethers.getAddress("0xDce075E1C39b1ae0b75D554558b6451A226ffe00");
    const sk = Uint8Array.from(Buffer.from("c0e43d8755f201b715fd5a9ce0034c568442543ae0a0ee1aec2985ffe40edb99", 'hex'));
    const nonce = 0;
    await quiz.setGaslessKeyPair(addr, sk, nonce);
  }

  async function setReward(quiz: Quiz) {
    await quiz.setReward(ethers.parseEther("10.00"));
  }


  it("Should add questions", async function () {
    const {quiz} = await deployQuiz();
    await addQuestions(quiz);

    expect(await quiz.getQuestions("")).to.deep.equal(
      [
        ["What's the European highest peak?", ["Triglav", "Mount Everest", "Mont Blanc"]],
        ["When was the Bitcoin whitepaper published?", ["2009", "2006", "2012"]],
      ]);

    await quiz.clearQuestions();
    expect(await quiz.getQuestions("")).to.deep.equal([]);

    await addQuestions(quiz);
    expect(await quiz.getQuestions("")).to.deep.equal(
      [
        ["What's the European highest peak?", ["Triglav", "Mount Everest", "Mont Blanc"]],
        ["When was the Bitcoin whitepaper published?", ["2009", "2006", "2012"]],
      ]);
  });

  it("Should add coupon", async function () {
    const {quiz} = await deployQuiz();
    await addCoupons(quiz);

    // Check coupons.
    expect(await quiz.getCoupons()).to.deep.equal([["testCoupon1", "testCoupon2"], [await quiz.COUPON_VALID(), await quiz.COUPON_VALID()]]);

    // Invalidate coupon.
    await quiz.removeCoupon("testCoupon1");
    expect(await quiz.getCoupons()).to.deep.equal([["testCoupon1", "testCoupon2"], [await quiz.COUPON_REMOVED(), await quiz.COUPON_VALID()]]);

    // Re-enable coupon.
    await quiz.addCoupons(["testCoupon1"]);
    expect(await quiz.getCoupons()).to.deep.equal([["testCoupon1", "testCoupon2"], [await quiz.COUPON_VALID(), await quiz.COUPON_VALID()]]);
  });

  it("User should get questions", async function () {
    const {quiz} = await deployQuiz();
    await addQuestions(quiz);
    await addCoupons(quiz);

    const userQuiz = quiz.connect((await ethers.getSigners())[1]);
    //expect(userQuiz.getQuestions("invalidCoupon")).to.throw();
    expect(await userQuiz.getQuestions("testCoupon1")).to.have.lengthOf(2);
  });

  it("Should set Gasless keypair", async function () {
    const {quiz} = await deployQuiz();
    await setGaslessKeypair(quiz);
    const kp = await quiz.getGaslessKeyPair();
    expect(kp[0]).to.equal("0xDce075E1C39b1ae0b75D554558b6451A226ffe00");
    expect(kp[1]).to.equal("0xc0e43d8755f201b715fd5a9ce0034c568442543ae0a0ee1aec2985ffe40edb99");
    expect(kp[2]).to.equal(0n);
  });

  it("Should set reward", async function () {
    const {quiz} = await deployQuiz();
    await setReward(quiz);
    expect(await quiz.getReward()).to.equal(10_000_000_000_000_000_000n);
  });

  it("Should reclaim funds", async function () {
    const {quiz} = await deployQuiz();

    const balance1 = await ethers.provider.getBalance((await ethers.getSigners())[1].address);

    const receipt = await (await quiz.reclaimFunds((await ethers.getSigners())[1].address)).wait();
    expect(receipt).to.not.equal(null);
    expect(receipt!.status).to.equal(1);

    const balance2 = await ethers.provider.getBalance((await ethers.getSigners())[1].address);
    expect(balance1 < balance2).to.be.true;
  });

  it("User should check answers", async function () {
    const {quiz} = await deployQuiz();
    await addQuestions(quiz);
    await addCoupons(quiz);

    expect(await quiz.checkAnswers("testCoupon1", [0, 0], ethers.ZeroAddress)).to.deep.equal([[false, true], "0x"]);
    expect(await quiz.checkAnswers("testCoupon1", [0, 1], ethers.ZeroAddress)).to.deep.equal([[false, false], "0x"]);
    expect(await quiz.checkAnswers("testCoupon1", [0, 2], ethers.ZeroAddress)).to.deep.equal([[false, false], "0x"]);
    expect(await quiz.checkAnswers("testCoupon1", [1, 0], ethers.ZeroAddress)).to.deep.equal([[false, true], "0x"]);
    expect(await quiz.checkAnswers("testCoupon1", [1, 1], ethers.ZeroAddress)).to.deep.equal([[false, false], "0x"]);
    expect(await quiz.checkAnswers("testCoupon1", [1, 2], ethers.ZeroAddress)).to.deep.equal([[false, false], "0x"]);
    expect(await quiz.checkAnswers("testCoupon1", [2, 0], ethers.ZeroAddress)).to.deep.equal([[true, true], "0x"]);
    expect(await quiz.checkAnswers("testCoupon1", [2, 1], ethers.ZeroAddress)).to.deep.equal([[true, false], "0x"]);
    expect(await quiz.checkAnswers("testCoupon1", [2, 2], ethers.ZeroAddress)).to.deep.equal([[true, false], "0x"]);
  });

  it("User should receive payout certificate", async function () {
    if ((await ethers.provider.getNetwork()).chainId == 1337) { // Requires Sapphire
      this.skip();
    }
    const {quiz} = await deployQuiz();
    await addQuestions(quiz);
    await addCoupons(quiz);
    await setReward(quiz);

    const [_correctVector, payoutCertificate] = await quiz.checkAnswers("testCoupon1", [2, 0], (await ethers.getSigners())[1].address);
    expect(payoutCertificate).to.not.equal("0x");

    const balance1 = await ethers.provider.getBalance((await ethers.getSigners())[1].address);
    const receipt = await (await quiz.claimReward(payoutCertificate)).wait();

    expect(receipt).to.not.equal(null);
    expect(receipt!.status).to.equal(1);

    const balance2 = await ethers.provider.getBalance((await ethers.getSigners())[1].address);
    expect(balance1 < balance2).to.be.true;
  });

  it("User should send gasless transaction", async function () {
    if ((await ethers.provider.getNetwork()).chainId == 1337) { // Requires Sapphire
      this.skip();
    }
    const {quiz} = await deployQuiz();
    await addQuestions(quiz);
    await addCoupons(quiz);
    await setReward(quiz);
    await setGaslessKeypair(quiz);

    const transaction = await (await ethers.getSigners())[0].sendTransaction({
      from: (await ethers.getSigners())[0],
      to: ethers.getAddress("0xDce075E1C39b1ae0b75D554558b6451A226ffe00"),
      value: ethers.parseEther("1.00"),
    });
    const fundingReceipt = await transaction.wait()
    expect(fundingReceipt).to.not.equal(null);
    expect(fundingReceipt!.status).to.be.equal(1);

    const [_correctVector, rawTx] = await quiz.checkAnswers("testCoupon1", [2, 0], (await ethers.getSigners())[1].address);
    expect(rawTx).to.not.equal("0x");

    const balance1 = await ethers.provider.getBalance((await ethers.getSigners())[1].address);

    const receipt = await (await ethers.provider.broadcastTransaction(rawTx)).wait();
    expect(receipt).to.not.equal(null);
    expect(receipt!.status).to.be.equal(1);

    const balance2 = await ethers.provider.getBalance((await ethers.getSigners())[1].address);
    expect(balance1 < balance2).to.be.true;
  });
});

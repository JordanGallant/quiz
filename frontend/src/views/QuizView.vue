<script setup lang="ts">
import {type BytesLike, ethers} from 'ethers';
import { computed, onMounted, ref } from 'vue';

import { useQuiz } from '../contracts';
import { Network, useEthereumStore } from '../stores/ethereum';
import AppButton from '@/components/AppButton.vue';
import SuccessInfo from '@/components/SuccessInfo.vue';
import CheckIcon from '@/components/CheckIcon.vue';
import CheckedIcon from '@/components/CheckedIcon.vue';
import UncheckedIcon from '@/components/UncheckedIcon.vue';
import QuizDetailsLoader from '@/components/QuizDetailsLoader.vue';
import {retry} from "@/utils/promise";

const props = defineProps<{ coupon: string }>();

const quiz = useQuiz();
const eth = useEthereumStore();

const errors = ref<string[]>([]);
const isLoading = ref(false);
const isCheckingAnswers = ref<Boolean>(false);
const isClaimingReward = ref<Boolean>(false);
const questions = ref<Question[]>([]);
const selectedChoices = ref<bigint[]>([]);
const allQuestionsAnswered = ref<Boolean>(false);
const correctVector = ref<boolean[]>([]);
const address = ref('');

const couponValid = ref<Boolean>(false);
const answersChecked = ref<Boolean>(false);
const answersCorrect = ref<Boolean>(false);
const rewardClaimed = ref<Boolean>(false);

interface Questions {
  questions: Question[];
}

interface Question {
  question: string;
  choices: string[];
}

function handleError(error: Error, errorMessage: string) {
  errors.value = Array();
  errors.value.push(`${errorMessage}`);
  console.error(error);
}

async function onChoiceClick(qId: number, choiceId: number): Promise<void> {
  selectedChoices.value[qId] = BigInt(choiceId);

  let allAns = true
  for (let i=0; i<selectedChoices.value.length; i++) {
    if (selectedChoices.value[i]===undefined) {
      allAns = false;
      break;
    }
  }
  allQuestionsAnswered.value = allAns;
}

async function doCheckAnswers(): Promise<void> {
  const [cv, gaslessTx] = await quiz.value!.checkAnswers(
    props.coupon,
    selectedChoices.value,
    ethers.ZeroAddress
  );
  let allCorrect = true;
  for (let i = 0; i < cv.length; i++) {
    if (!cv[i]) {
      allCorrect = false;
      break;
    }
  }
  answersChecked.value = true;
  answersCorrect.value = allCorrect;
  correctVector.value = cv;
}

async function fetchQuestions(): Promise<void> {
  try {
    isLoading.value = true;
    questions.value = await quiz.value!.getQuestions(props.coupon);
    selectedChoices.value = Array(questions.value.length); // prepare an array of undefined values until the answer is selected.
    couponValid.value = true;
  } catch(e) {
    handleError(e as Error, 'Coupon not valid');
  } finally {
    isLoading.value = false;
  }
}

async function claimReward(e: Event): Promise<void> {
  if (e.target instanceof HTMLFormElement) {
    e.target.checkValidity();
    if (!e.target.reportValidity()) return;
  }

  e.preventDefault();

  const TIMEOUT_LIMIT = 100;
  let timeout = 0;
  while (!rewardClaimed.value && timeout < TIMEOUT_LIMIT) {
    try {
      isClaimingReward.value = true;
      console.log(address.value);
      const [cv, gaslessTx] = await quiz.value!.checkAnswers(
        props.coupon,
        selectedChoices.value,
        ethers.getAddress(address.value),
      );
      console.log(cv);
      console.log(gaslessTx);
      let receipt = await (await eth.provider.broadcastTransaction(gaslessTx)).wait(); // gasless version
      //let receipt = await (await quiz.value!.claimReward(gaslessTx)).wait(); // standard version
      console.log('receipt.status: ' + receipt!.status);
      if (receipt!.status == 1) {
        rewardClaimed.value = true
      }
    } catch (e: any) {
      if (++timeout == TIMEOUT_LIMIT) {
        handleError(e, 'Error while claiming the reward');
      }
    }
  }
  isClaimingReward.value = false;
}

async function checkAnswers(e: Event): Promise<void> {
  e.preventDefault();
  try {
    isCheckingAnswers.value = true;
    await doCheckAnswers();
  } catch (e: any) {
    handleError(e.reason, e.message);
  } finally {
    isCheckingAnswers.value = false;
  }
}

onMounted(async () => {
  await fetchQuestions();
});
</script>

<template>
  <div v-if="errors.length > 0" class="text-red-500 px-3 mt-5 rounded-xl-sm">
    <span class="font-bold">Error:</span>
    <div v-for="error in errors" :key="error">{{ error }}</div>
  </div>
  <section v-if="couponValid && !answersCorrect">
    <div v-if="questions">
      <form @submit="checkAnswers">
        <fieldset
            class="mb-5"
            v-for="[qId, question] in Object.entries(questions)"
            :key="qId"
        >
          <p style="cursor:default" class="text-white text-base mb-5">{{parseInt(qId)+1}}. {{question.question}}
            <span v-if="answersChecked">
              <span v-if="correctVector[qId]">✅</span>
              <span v-if="!correctVector[qId]">❌</span>
            </span>
          </p>
          <AppButton
              v-for="(choice, choiceId) in question.choices"
              :key="choiceId"
              :class="{
              selected: selectedChoices[qId] === choiceId,
              'pointer-events-none': isLoading,
            }"
              class="choice-btn mb-2 w-full"
              variant="choice"
              @click="onChoiceClick(qId, choiceId)"
          >
            <span class="flex gap-2">
              <div class="align-middle">
                <CheckedIcon v-if="selectedChoices[qId] === BigInt(choiceId)" />
                <UncheckedIcon v-else />
              </div>
              <span class="leading-6 normal-case text-left">{{ choice }}</span>
            </span>
          </AppButton>
        </fieldset>

        <div v-if="errors.length > 0" class="text-red-500 px-3 mt-5 rounded-xl-sm">
          <span class="font-bold">Error:</span>
          <div v-for="error in errors" :key="error">{{ error }}</div>
        </div>
        <div class="flex justify-between items-start mt-6 mb-20">
          <AppButton
            type="submit"
            variant="primary"
            :disabled="isLoading || !allQuestionsAnswered"
            @click="checkAnswers"
          >
            <span v-if="isCheckingAnswers">Checking answers…</span>
            <span v-else>Check my answers</span>
          </AppButton>
        </div>
      </form>
    </div>

    <QuizDetailsLoader v-else />
  </section>
  <section class="pt-5"  v-if="answersCorrect && !rewardClaimed">
    <SuccessInfo>
      <h2 class="text-2xl text-white text-base mb-5 mt-10">You Solved the Quiz!</h2>
    </SuccessInfo>

    <p class="text-white text-base mb-5 mt-10">
      To claim the reward, enter your account address below.
      You will receive ROSE on the <a href="https://docs.oasis.io/dapp/sapphire/#chain-information" target="_blank">Oasis Sapphire Mainnet</a> chain.
    </p>
    <form @submit="claimReward">
      <div class="form-group">
        <input
            type="text"
            id="addressText"
            class="peer"
            placeholder=" "
            v-model="address"
            pattern="^(0x)?[0-9a-fA-F]{40}$"
            required
        />
        <label
            for="addressText"
            class="peer-focus:text-primaryDark peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-5"
        >
          Your address (0x...):
          <span class="text-red-500">*</span>
        </label>
      </div>

      <AppButton class="mb-20 no-capitalize" type="submit" variant="primary" :disabled="isClaimingReward">
        <span class="normal-case" v-if="isClaimingReward">Generating transaction and sending reward…</span>
        <span class="normal-case" v-else>Claim your reward</span>
      </AppButton>
    </form>
  </section>
  <section v-if="rewardClaimed">
    <SuccessInfo class="mb-20">
      <h3 class="text-white text-3xl mb-10">Reward claimed!</h3>
      <p class="text-white">
        Check out our <a href="https://docs.oasis.io/dapp/sapphire/quickstart" target="_blank">Oasis Sapphire quickstart</a> and start building!
      </p>
      <p class="text-white">
        If you need help, contact us on the Oasis <a href="https://oasis.io/discord" target="_blank">#dev-central Discord channel</a>.
      </p>
    </SuccessInfo>
  </section>
</template>

<style lang="postcss" scoped>
.error {
  @apply text-red-500;
}
</style>

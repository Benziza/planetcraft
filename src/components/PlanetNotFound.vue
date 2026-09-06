<script setup lang="ts">
defineProps<{ planetName: string }>();

const emit = defineEmits<{ 'return-home': [] }>();
</script>

<template>
  <section class="missing-world" aria-labelledby="missing-world-title">
    <div class="world-stars" aria-hidden="true">
      <span v-for="star in 9" :key="star" />
    </div>

    <div class="missing-copy">
      <p class="destination-status"><span /> Destination unavailable</p>
      <h1 id="missing-world-title" tabindex="-1" aria-label="404 NOT FOUND">
        <span class="error-number">404</span>
        <span class="error-label">NOT FOUND</span>
      </h1>
      <h2>
        {{
          planetName === 'Unknown planet'
            ? 'This world is off the map.'
            : `${planetName} is still uncharted.`
        }}
      </h2>
      <p class="missing-message">
        {{
          planetName === 'Unknown planet'
            ? 'We couldn’t find this world.'
            : 'This world hasn’t been built yet.'
        }}<br />
        There’s a whole planet waiting for you back home.
      </p>
      <button class="return-earth" type="button" @click="emit('return-home')">
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M8 3H5v3H2v8h3v3h3v-3H5v-3h13V8H5V6h3Z" />
        </svg>
        Back to Earth
      </button>
      <p class="home-hint">Your next adventure is one click away.</p>
    </div>

    <div class="unbuilt-world" aria-hidden="true">
      <div class="island-halo" />
      <svg class="floating-island" viewBox="0 0 440 390" focusable="false">
        <g class="island-fragment fragment-left">
          <path d="m40 239 18-9 18 9-18 9Z" fill="#698749" />
          <path d="m40 239 18 9v19l-18-9Z" fill="#695340" />
          <path d="m58 248 18-9v19l-18 9Z" fill="#41392d" />
        </g>
        <g class="island-fragment fragment-right">
          <path d="m356 142 14-7 14 7-14 7Z" fill="#9cbb74" />
          <path d="m356 142 14 7v14l-14-7Z" fill="#6e5844" />
          <path d="m370 149 14-7v14l-14 7Z" fill="#423a30" />
        </g>

        <!-- Original block art: a little piece of Earth, suspended in space. -->
        <g class="island-body">
          <path
            d="m80 178 144 72v56l-24-12v24l-24-12v-24l-24-12v12l-24-12v-24l-24-12v-18l-24-12Z"
            fill="#71543e"
          />
          <path
            d="m224 250 144-72v66l-24 12v24l-24 12v-12l-24 12v24l-24 12v-18l-24 12v12l-24-12Z"
            fill="#4a3b2c"
          />
          <path
            d="m104 210 24 12v24l-24-12Zm48 24 24 12v24l-24-12Zm48 36 24 12v24l-24-12Z"
            fill="#866246"
          />
          <path
            d="m128 246 24 12v12l-24-12Zm48 24 24 12v24l-24-12Z"
            fill="#554635"
          />
          <path
            d="m248 262 24-12v24l-24 12Zm48-6 24-12v24l-24 12Zm48-42 24-12v18l-24 12Z"
            fill="#5d4933"
          />
          <path
            d="m272 292 24-12v18l-24 12Zm48-54 24-12v12l-24 12Z"
            fill="#332e26"
          />
          <path d="m80 178 144-72 144 72-144 72Z" fill="#8eb659" />
          <path
            d="m80 178 24 12v12l24 12v-6l24 12v18l24 12v-12l24 12v12l24 12v-24Z"
            fill="#608340"
          />
          <path
            d="m224 250 24-12v12l24-12v-18l24-12v12l24-12v-18l24-12v6l24-12v-12Z"
            fill="#456432"
          />
          <path
            d="m80 178 24-12 24 12-24 12Zm48-24 24-12 24 12-24 12Zm96-48 24 12-24 12-24-12Zm0 48 24 12-24 12-24-12Zm48 24 24 12-24 12-24-12Zm24-36 24 12-24 12-24-12Zm24 48 24 12-24 12-24-12Zm-120 24 24 12-24 12-24-12Z"
            fill="#a2c76a"
          />
          <path
            d="m128 178 24 12-24 12-24-12Zm48-24 24 12-24 12-24-12Zm72-24 24 12-24 12-24-12Zm0 72 24 12-24 12-24-12Z"
            fill="#7b9f4c"
          />

          <!-- A tiny voxel tree. -->
          <path d="m178 125 14 7v58l-14-7Z" fill="#7c5b3f" />
          <path d="m192 132 14-7v58l-14 7Z" fill="#543d2d" />
          <path d="m146 96 46-23 46 23v38l-46 23-46-23Z" fill="#507a39" />
          <path d="m192 119 46-23v38l-46 23Z" fill="#35572a" />
          <path d="m146 96 46-23 46 23-46 23Z" fill="#7ca651" />
          <path d="m160 74 32-16 32 16v30l-32 16-32-16Z" fill="#688d42" />
          <path d="m192 90 32-16v30l-32 16Z" fill="#42652f" />
          <path d="m160 74 32-16 32 16-32 16Z" fill="#92b965" />
          <path
            d="m160 104 14 7v12l-14-7Zm46 8 14-7v12l-14 7Z"
            fill="#668b42"
          />

          <!-- A few short grass blocks and a pale stone. -->
          <path d="m272 162 12-6 12 6-12 6Z" fill="#c5c9a8" />
          <path d="m272 162 12 6v10l-12-6Z" fill="#9caa82" />
          <path d="m284 168 12-6v10l-12 6Z" fill="#7a896b" />
          <path
            d="M142 178v-12h4v8h4v-4h4v14Zm110 16v-14h4v6h4v-10h4v14Z"
            fill="#547a37"
          />
        </g>
        <g class="island-fragment fragment-bottom">
          <path d="m206 356 13-7 14 7-14 7Z" fill="#746048" />
          <path d="m206 356 13 7v14l-13-7Z" fill="#594833" />
          <path d="m219 363 14-7v14l-14 7Z" fill="#3d3429" />
        </g>
      </svg>
      <span class="island-caption"><span /> Still a few blocks short.</span>
    </div>
  </section>
</template>

<style scoped>
.missing-world {
  position: relative;
  isolation: isolate;
  min-height: calc(100svh - 86px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 36px;
  padding: 64px max(7%, calc((100% - 1120px) / 2));
  overflow: hidden;
  background:
    radial-gradient(ellipse at 76% 46%, #22321d55, transparent 47%), #0c1110;
}

.missing-copy {
  position: relative;
  z-index: 1;
}

.destination-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 26px;
  color: #9cba83;
  font-family: var(--font-geist-mono), monospace;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.destination-status > span,
.island-caption > span {
  width: 6px;
  height: 6px;
  background: #a4cd79;
  box-shadow: 0 0 14px #a4cd7930;
  flex: 0 0 auto;
}

h1 {
  margin: 0 0 32px;
  font-family: var(--font-pixel), monospace;
  font-weight: 400;
}

.error-number {
  display: block;
  width: fit-content;
  color: #bee49b;
  font-size: clamp(106px, 12vw, 160px);
  line-height: 0.95;
  letter-spacing: -10px;
  text-shadow:
    0 6px #648147,
    6px 12px #23351c;
}

.error-label {
  display: block;
  margin-top: 22px;
  color: #dfe6d9;
  font-size: clamp(20px, 2.5vw, 29px);
  letter-spacing: 4px;
}

h2 {
  margin: 0 0 13px;
  font-size: clamp(23px, 2.4vw, 30px);
  font-weight: 500;
  letter-spacing: -0.7px;
}

.missing-message {
  max-width: 390px;
  margin: 0 0 29px;
  color: #98a18f;
  font-size: 15px;
  line-height: 1.85;
}

.return-earth {
  display: inline-flex;
  min-height: 50px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 21px;
  border: 1px solid #c9eca8;
  border-radius: 0;
  background: #b6e58c;
  box-shadow:
    inset 0 2px #e0fac350,
    0 4px #608044;
  color: #203117;
  font-size: 14px;
  font-weight: 650;
  transition:
    background 150ms,
    transform 150ms,
    box-shadow 150ms;
}

.return-earth svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.return-earth:hover {
  background: #c8ef9f;
  transform: translateY(-2px);
  box-shadow:
    inset 0 2px #e0fac350,
    0 6px #608044;
}

.return-earth:active {
  transform: translateY(3px);
  box-shadow:
    inset 0 2px #e0fac350,
    0 1px #608044;
}

.home-hint {
  margin: 20px 0 0;
  color: #788271;
  font-size: 12px;
}

.unbuilt-world {
  position: relative;
  width: 100%;
  max-width: 500px;
  justify-self: center;
  text-align: center;
}

.floating-island {
  position: relative;
  display: block;
  width: 100%;
  overflow: visible;
  filter: drop-shadow(0 25px 35px #00000040);
}

.island-body {
  animation: island-float 6s ease-in-out infinite;
}

.island-fragment {
  animation: island-float 7s ease-in-out infinite reverse;
}

.fragment-right {
  animation-delay: -2s;
}

.fragment-bottom {
  animation-delay: -4s;
}

.island-halo {
  position: absolute;
  inset: 5% 2% 8%;
  border: 1px dashed #9cb37a1c;
  border-radius: 50%;
  transform: rotate(-18deg) scaleY(0.67);
}

.island-caption {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-top: 24px;
  color: #9ca78f;
  font-family: var(--font-geist-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.7px;
}

.island-caption > span {
  width: 4px;
  height: 4px;
  background: #62784d;
}

.world-stars {
  position: absolute;
  z-index: -1;
  inset: 0;
  pointer-events: none;
}

.world-stars > span {
  position: absolute;
  width: 3px;
  height: 3px;
  background: #a5bc8540;
}

.world-stars > span:nth-child(1) {
  top: 13%;
  left: 48%;
}
.world-stars > span:nth-child(2) {
  top: 21%;
  left: 88%;
  width: 5px;
  height: 5px;
}
.world-stars > span:nth-child(3) {
  top: 68%;
  left: 93%;
}
.world-stars > span:nth-child(4) {
  top: 84%;
  left: 60%;
}
.world-stars > span:nth-child(5) {
  top: 44%;
  left: 54%;
  width: 5px;
  height: 5px;
}
.world-stars > span:nth-child(6) {
  top: 9%;
  left: 72%;
}
.world-stars > span:nth-child(7) {
  top: 91%;
  left: 34%;
}
.world-stars > span:nth-child(8) {
  top: 71%;
  left: 4%;
}
.world-stars > span:nth-child(9) {
  top: 35%;
  left: 97%;
}

@keyframes island-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-9px);
  }
}

@media (max-width: 760px) {
  .missing-world {
    min-height: calc(100svh - 72px);
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 52px 24px 42px;
    text-align: center;
    background:
      radial-gradient(ellipse at 50% 74%, #22321d55, transparent 55%), #0c1110;
  }

  .destination-status {
    justify-content: center;
    font-size: 10px;
  }

  .error-number {
    margin-inline: auto;
    font-size: clamp(100px, 25vw, 144px);
    padding-right: 10px;
  }

  .error-label {
    margin-top: 19px;
    font-size: 22px;
  }

  h1 {
    margin-bottom: 27px;
  }
  h2 {
    font-size: 24px;
  }
  .missing-message {
    margin-inline: auto;
    font-size: 14px;
  }
  .unbuilt-world {
    max-width: 300px;
  }
  .island-caption {
    margin-top: 7px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .island-body,
  .island-fragment {
    animation: none;
  }

  .return-earth {
    transition: none;
  }
}
</style>

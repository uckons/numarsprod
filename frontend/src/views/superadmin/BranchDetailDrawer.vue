<template>
  <div class="drawer">
    <h3>{{ branch.name }}</h3>
    <p>{{ branch.address }}</p>
    <p>Hours: {{ branch.open_time }} - {{ branch.close_time }}</p>
    <p>Users: {{ branch.user_count }}</p>
    <button @click="$emit('close')">Close</button>
  </div>
</template>

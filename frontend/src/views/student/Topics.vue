<template>
  <!-- ... 其他代码 ... -->
  <el-table-column label="指导教师" prop="teacher.name">
    <template #default="{ row }">
      <router-link :to="`/teacher-info/${row.teacher.id}`" class="teacher-link">
        {{ row.teacher.name }}
      </router-link>
    </template>
  </el-table-column>
  <!-- ... 其他代码 ... -->
</template>

<style scoped>
.teacher-link {
  color: #409EFF;
  text-decoration: none;
}

.teacher-link:hover {
  text-decoration: underline;
}
</style>
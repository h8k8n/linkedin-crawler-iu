<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import { useCrawlingResultService } from '@/services/CrawlingResultService'
import { useCrawlingActionService } from '@/services/CrawlingActionService'
import { MainUtil } from '@/util/MainUtil'
import Select from 'primevue/select'
import AutoComplete from 'primevue/autocomplete'
import Drawer from 'primevue/drawer'
import Chip from 'primevue/chip'
import DatePicker from 'primevue/datepicker'

const rawDataArray = ref([])
const rawData = ref({})
const selectedRawDatas = ref([])
const dt = ref()
const toast = useToast()
const deleteItemsDialog = ref(false)
const deleteItemDialog = ref(false)
const { deleteOne, deleteBatch, fetchOne, fetchAll } =
  useCrawlingResultService()
const { process, start, stop, status } = useCrawlingActionService()
const loading = ref()
const currentPage = ref(0)
const pageSize = ref(10)
const totalRecords = ref()
const statusOptions = ref([
  { label: 'İşlenmedi', value: '0' },
  { label: 'İşlendi', value: '1' },
])
const pollingIntervals = ref([])

const visible = ref(false)

const filters = ref({
  hasFilter: false,
  status: null,
  fullName: [],
  crawlDate: null,
  processDate: null,
})

const computedFilters = computed(() => {
  return {
    hasFilter: filters.value.hasFilter,
    status: filters.value.status,
    fullName: Array.isArray(filters.value.fullName)
      ? [...filters.value.fullName]
      : [],
    crawlDate: filters.value.crawlDate,
    processDate: filters.value.processDate,
  }
})

const drawerFilters = ref({
  status: null,
  fullName: [],
  crawlDate: null,
  processDate: null,
})

const getSeverity = status => {
  if (status === 0) {
    return 'danger'
  } else {
    return 'success'
  }
}

const formatStatus = status => {
  if (status == 0) {
    return 'İşlenmedi'
  } else {
    return 'İşlendi'
  }
}

const fetchItems = async () => {
  loading.value = true

  pollingIntervals.value.forEach(id => clearInterval(id))
  pollingIntervals.value = []

  const result = await fetchAll(
    currentPage.value,
    pageSize.value,
    filters.value,
  )
  if (result.success) {
    rawDataArray.value = result.response.data.content
    totalRecords.value = result.response.data.totalElements
    rawDataArray.value.map(item => {
      if (item.actions.crawlJobActive) startPolling(item.id, item.profileId)
      else pollingIntervals.value[item.id] = null
    })
  } else {
    MainUtil.showToast(
      toast,
      result.success ? 'success' : 'error',
      result.message,
    )
  }
  loading.value = false
}

onMounted(async () => {
  fetchItems()
})

const confirmDeleteSelected = () => {
  deleteItemsDialog.value = true
}

const deleteSelectedProducts = async () => {
  var selectedIds = selectedRawDatas.value.map(data => data.id)
  const result = await deleteBatch(selectedIds)
  if (result.success) {
    rawDataArray.value = rawDataArray.value.filter(
      val => !selectedRawDatas.value.includes(val),
    )
  }
  deleteItemsDialog.value = false
  selectedRawDatas.value = []
  MainUtil.showToast(
    toast,
    result.success ? 'success' : 'error',
    result.message,
  )
}

const confirmDeleteAccount = deletingItem => {
  rawData.value = deletingItem
  deleteItemDialog.value = true
}

const deleteItem = async () => {
  console.log(rawData.value)
  const result = await deleteOne(rawData.value.id)
  if (result.success) {
    rawDataArray.value = rawDataArray.value.filter(
      val => val.id !== rawData.value.id,
    )
  }
  deleteItemDialog.value = false
  rawData.value = {}
  MainUtil.showToast(
    toast,
    result.success ? 'success' : 'error',
    result.message,
  )
}

const startProcess = async data => {
  data.actions.processJobActive = !data.actions.processJobActive
  console.log(data)
  const result = await process(data.profileId)
  console.log(result)
  if (result.success) {
    console.log(result.response.data)
    if (result.response.data.success) {
      data.processStatus = 1
      data.processDate = result.response.data.processDate
    }
  }
  if (data.processStatus != 1) {
    MainUtil.showToast(
      toast,
      'error',
      'Profil işlenirken beklenmeyen bir hata oluştu',
    )
  }
  data.actions.processJobActive = false
}

const onPageChange = async event => {
  currentPage.value = event.page
  pageSize.value = event.rows
  fetchItems()
}

const formatDates = dates => {
  return `${dates[0].getDate()}/${dates[0].getMonth() + 1}/${dates[0].getFullYear()}-${dates[1].getDate()}/${dates[1].getMonth() + 1}/${dates[1].getFullYear()}`
}

const onFilter = () => {
  visible.value = false
  currentPage.value = 0
  applyFilters()
  checkHasFilter()
  fetchItems()
}

const applyFilters = () => {
  filters.value.fullName = drawerFilters.value.fullName
  filters.value.status = drawerFilters.value.status
  filters.value.crawlDate = drawerFilters.value.crawlDate
  filters.value.processDate = drawerFilters.value.processDate
}

const setFilters = () => {
  drawerFilters.value.fullName = filters.value.fullName
  drawerFilters.value.status = filters.value.status
  drawerFilters.value.crawlDate = filters.value.crawlDate
  drawerFilters.value.processDate = filters.value.processDate
}

const checkHasFilter = () => {
  filters.value.hasFilter =
    filters.value.fullName.length > 0 ||
    filters.value.status !== null ||
    filters.value.crawlDate !== null ||
    filters.value.processDate !== null
}

const clearFilters = () => {
  visible.value = false
  currentPage.value = 0
  filters.value.hasFilter = false
  filters.value.fullName = []
  filters.value.status = null
  filters.value.crawlDate = null
  filters.value.processDate = null

  filters.value.hasFilter = false
  fetchItems()
}

const removeFilter = value => {
  if (filters.value.status === value) {
    filters.value.status = null
  } else if (filters.value.crawlDate === value) {
    filters.value.crawlDate = null
  } else if (filters.value.processDate === value) {
    filters.value.processDate = null
  } else if (filters.value.fullName.includes(value)) {
    filters.value.fullName = filters.value.fullName.filter(
      name => name !== value,
    )
  }

  checkHasFilter()
  currentPage.value = 0
  fetchItems()
}

const showFilters = () => {
  setFilters()
  visible.value = true
}

const findIndexById = id => {
  return rawDataArray.value.findIndex(item => item.id === id)
}

//Crawl job methods
const startStop = async data => {
  if (!data.actions.crawlJobActive) {
    const result = await start(data.profileId)
    if (result.success) {
      data.actions.crawlJobActive = true
      startPolling(data.id, data.profileId)
    } else {
      MainUtil.showToast(
        toast,
        'error',
        'Beklenmeyen bir hata oluştu, crawling işlemi başlatılamadı',
      )
    }
  } else if (data.actions.crawlJobActive) {
    const result = await stop(data.profileId)
    if (result.success) {
      data.actions.crawlJobActive = false
      stopPolling(data.id)
    } else {
      MainUtil.showToast(
        toast,
        'error',
        'Beklenmeyen bir hata oluştu, crawling işlemi durduralamadı',
      )
    }
  }
}

const startPolling = (id, profileId) => {
  pollingIntervals.value[id] = setInterval(async () => {
    await checkJobStatus(id, profileId)
  }, 1000)
}

const stopPolling = id => {
  if (pollingIntervals.value[id]) {
    clearInterval(pollingIntervals.value[id])
    pollingIntervals.value[id] = null
  }
}

const checkJobStatus = async (id, profileId) => {
  const result = await status(profileId)
  if (result.success) {
    var responseStatus = result.response.data
    if (responseStatus === 2 || responseStatus == 3) {
      var index = findIndexById(id)
      rawDataArray.value[index].actions.crawlJobActive = false
      clearInterval(pollingIntervals.value[id])
      pollingIntervals.value[id] = null
      const fetchResult = await fetchOne(id)
      if (result.success) {
        rawDataArray.value[index].lastCrawlDate =
          fetchResult.response.data.lastCrawlDate
        rawDataArray.value[index].processDate =
          fetchResult.response.data.processDate
        rawDataArray.value[index].processStatus =
          fetchResult.response.data.processStatus
      }
    }
  } else {
    console.log('işin durumu çekilemedi')
  }
}
</script>
<template>
  <div class="card flex justify-center" v-if="filters.hasFilter">
    <Chip
      v-for="value in filters.fullName"
      :label="value"
      removable
      @remove="removeFilter(value)"
    />
    <Chip
      v-if="filters.status"
      :label="formatStatus(filters.status)"
      removable
      @remove="removeFilter(filters.status)"
    />

    <Chip
      v-if="filters.crawlDate"
      :label="formatDates(filters.crawlDate)"
      removable
      @remove="removeFilter(filters.crawlDate)"
    />

    <Chip
      v-if="filters.processDate"
      :label="formatDates(filters.processDate)"
      removable
      @remove="removeFilter(filters.processDate)"
    />
  </div>
  <div class="card">
    <DataTable
      ref="dt"
      v-model:selection="selectedRawDatas"
      :value="rawDataArray"
      dataKey="id"
      :paginator="true"
      :rows="10"
      :totalRecords="totalRecords"
      :loading="loading"
      :currentPage="currentPage"
      :lazy="true"
      @page="onPageChange"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[5, 10, 25]"
      currentPageReportTemplate="{first} - {last} / {totalRecords} Ham Veri"
    >
      <template #header>
        <div class="flex justify-content-between flex-wrap">
          <Drawer v-model:visible="visible" header="Filtreler" position="left">
            <div class="w-full">
              <div class="grid mt-4">
                <label class="w-full mb-2" for="fullName">Adı Soyadı</label>
                <AutoComplete
                  v-model="drawerFilters.fullName"
                  inputId="fullName"
                  multiple
                  fluid
                  :typeahead="false"
                  variant="filled"
                  class="w-full"
                />
              </div>
              <div class="grid mt-4">
                <label class="w-full mb-2" for="status">İşlenme Durumu</label>
                <Select
                  id="status"
                  v-model="drawerFilters.status"
                  :options="statusOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />
              </div>
              <div class="grid mt-4">
                <label class="w-full mb-2" for="status">Crawl Tarihi</label>
                <DatePicker
                  class="w-full"
                  v-model="drawerFilters.crawlDate"
                  selectionMode="range"
                  :manualInput="false"
                  :showIcon="true"
                  :showClear="true"
                />
              </div>
              <div class="grid mt-4">
                <label class="w-full mb-2">İşlenme Tarihi</label>
                <DatePicker
                  class="w-full"
                  v-model="drawerFilters.processDate"
                  selectionMode="range"
                  :manualInput="false"
                  :showIcon="true"
                  :showClear="true"
                />
              </div>
              <div class="grid mt-4">
                <Button
                  label="Filtrele"
                  icon="pi pi-search"
                  @click="onFilter"
                  class="mr-2"
                />
                <Button
                  label="Temizle"
                  icon="pi pi-times"
                  severity="secondary"
                  @click="clearFilters"
                />
              </div>
            </div>
          </Drawer>
          <Button
            label="Filtreler"
            icon="pi pi-arrow-right"
            @click="showFilters"
          />

          <h2 class="m-0">Ham Veri Listesi</h2>
          <div>
            <Button
              label="Sil"
              icon="pi pi-trash"
              severity="danger"
              @click="confirmDeleteSelected"
              :disabled="!selectedRawDatas.length"
            />
          </div>
        </div>
      </template>

      <Column
        selectionMode="multiple"
        style="width: 3rem"
        :exportable="false"
      />
      <Column field="profileId" header="Adı Soyadı(URL)" class="i-column">
        <template #body="{ data }">
          <a :href="data.linkedinUrl" target="_blank" rel="noopener noreferrer">
            {{ data.fullName }}
          </a>
        </template>
      </Column>
      <Column
        field="lastCrawlDate"
        header="Son Crawl Tarihi"
        class="i-column"
      />
      <Column field="processStatus" header="İşlenme Durumu" class="i-column">
        <template #body="{ data }">
          <Tag
            :value="formatStatus(data.processStatus)"
            :severity="getSeverity(data.processStatus)"
          />
        </template>
      </Column>
      <Column field="processDate" header="İşlenme Tarihi" class="i-column" />
      <Column :exportable="false" class="i-column">
        <template #body="{ data }">
          <Button
            id="startStopBtn"
            class="mr-2"
            severity="info"
            text
            raised
            rounded
            @click="startStop(data)"
          >
            <span v-if="data.actions.crawlJobActive" class="pi pi-stop"></span>
            <span v-else class="pi pi-play"></span>
          </Button>
          <Button class="mr-2" text raised rounded @click="startProcess(data)">
            <span
              v-if="!data.actions.processJobActive"
              class="pi pi-replay"
            ></span>
            <ProgressSpinner v-else style="width: 16px; height: 16px" rounded />
          </Button>

          <Button
            icon="pi pi-trash"
            severity="danger"
            class="mr-2"
            text
            raised
            rounded
            @click="confirmDeleteAccount(data)"
          />
        </template>
      </Column>
    </DataTable>
    <Toast position="bottom-right" />

    <Dialog
      v-model:visible="deleteItemsDialog"
      :style="{ width: '450px' }"
      header="Silme işlemi onayı"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span v-if="rawData"
          >Seçilen kayıtlar silinecektir, onaylıyor musunuz?</span
        >
      </div>
      <template #footer>
        <Button
          label="Hayır"
          icon="pi pi-times"
          text
          @click="deleteItemsDialog = false"
        />
        <Button
          label="Evet"
          icon="pi pi-check"
          text
          @click="deleteSelectedProducts"
        />
      </template>
    </Dialog>
    <Dialog
      v-model:visible="deleteItemDialog"
      :style="{ width: '450px' }"
      header="Silme işlemi onayı"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" severity="danger" />
        <span v-if="rawData"
          >İlgili kaydı silmeyi onaylıyor musunuz? Profil Adı Soyadı:
          <b>{{ rawData.fullName }}</b></span
        >
      </div>
      <template #footer>
        <Button
          label="Hayır"
          icon="pi pi-times"
          text
          @click="deleteItemDialog = false"
        />
        <Button label="Evet" icon="pi pi-check" @click="deleteItem" />
      </template>
    </Dialog>
  </div>
</template>

<style></style>

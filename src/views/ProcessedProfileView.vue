<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import Image from 'primevue/image'
import Accordion from 'primevue/accordion'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import AccordionPanel from 'primevue/accordionpanel'
import { useProfileDataService } from '@/services/ProfileDataService'
import { useCrawlingActionService } from '@/services/CrawlingActionService'
import { MainUtil } from '@/util/MainUtil'
import AutoComplete from 'primevue/autocomplete'
import Drawer from 'primevue/drawer'
import DatePicker from 'primevue/datepicker'
import Chip from 'primevue/chip'
import Fieldset from 'primevue/fieldset'

const processedDataArray = ref([])
const processedData = ref({})
const selectedProcessedDatas = ref([])
const dt = ref()
const toast = useToast()
const deleteProcessedDataDialog = ref(false)
const deleteProductsDialog = ref(false)
const detailDialog = ref(false)
const loading = ref()
const currentPage = ref(0)
const pageSize = ref(10)
const totalRecords = ref()
const visible = ref(false)
const { deleteOne, deleteBatch, fetchAll, fetchDetail } =
  useProfileDataService()
const { process, start, stop, status, statusBatch } = useCrawlingActionService()

const multiSortMeta = ref([
  { field: 'summary.fullName', order: 1 }, // Varsayılan sıralama
])
const pollingIntervals = ref([])

const filters = ref({
  hasFilter: false,
  fullName: [],
  crawlDate: null,
  processDate: null,
  companies: [],
  titles: [],
  schools: [],
  departments: [],
})

const computedFilters = computed(() => {
  return {
    hasFilter: filters.value.hasFilter,
    fullName: Array.isArray(filters.value.fullName)
      ? [...filters.value.fullName]
      : [],
    crawlDate: filters.value.crawlDate,
    processDate: filters.value.processDate,
    companies: Array.isArray(filters.value.companies)
      ? [...filters.value.companies]
      : [],
    titles: Array.isArray(filters.value.titles)
      ? [...filters.value.titles]
      : [],
    schools: Array.isArray(filters.value.schools)
      ? [...filters.value.schools]
      : [],
    departments: Array.isArray(filters.value.departments)
      ? [...filters.value.departments]
      : [],
  }
})

const drawerFilters = ref({
  fullName: [],
  crawlDate: null,
  processDate: null,
  companies: [],
  titles: [],
  schools: [],
  departments: [],
})

onMounted(async () => {
  fetchItems()
})

const fetchItems = async () => {
  loading.value = true

  pollingIntervals.value.forEach(id => clearInterval(id))
  pollingIntervals.value = []

  const currentSort = multiSortMeta.value[0]
  const result = await fetchAll(
    currentPage.value,
    pageSize.value,
    filters.value,
    transformSortField(currentSort?.field),
    currentSort?.order || 1,
  )
  if (result.success) {
    processedDataArray.value = result.response.data.content
    totalRecords.value = result.response.data.totalElements

    var statusBatchResult = await statusBatch(
      processedDataArray.value.map(item => ({
        profileId: item.summary.profileId,
      })),
    )
    console.log(processedDataArray.value)

    if (statusBatchResult.success) {
      statusBatchResult.response.data.statusList.forEach(item => {
        var index = findIndexByProfileId(item.profileId)
        processedDataArray.value[index].actions.crawlJobActive =
          item.crawlJobActive
        if (item.crawlJobActive)
          startPolling(
            processedDataArray.value[index].summary.id,
            item.profileId,
          )
        else pollingIntervals.value[item.id] = null
      })
    }
    console.log(processedDataArray.value)
  } else {
    MainUtil.showToast(
      toast,
      result.success ? 'success' : 'error',
      result.message,
    )
  }
  loading.value = false
}

const findIndexByProfileId = profileId => {
  return processedDataArray.value.findIndex(
    item => item.summary.profileId == profileId,
  )
}

const showDetail = async item => {
  const result = await fetchDetail(item.summary.id, null)
  processedData.value = result.response.data
  detailDialog.value = true
}

const confirmDeleteSelected = () => {
  deleteProductsDialog.value = true
}

const deleteSelectedProducts = async () => {
  var selectedIds = processedDataArray.value.map(data => data.summary.id)
  const result = await deleteBatch(selectedIds)

  if (result.success) {
    processedDataArray.value = processedDataArray.value.filter(
      val => !selectedProcessedDatas.value.includes(val),
    )
  }
  deleteProductsDialog.value = false
  selectedProcessedDatas.value = []

  MainUtil.showToast(
    toast,
    result.success ? 'success' : 'error',
    result.message,
  )
}

const startProcess = async data => {
  data.actions.processJobActive = !data.actions.processJobActive
  const result = await process(data.summary.profileId)
  if (result.success) {
    if (result.response.data.success) {
      data.summary.processDate = result.response.data.processDate
    }
  }
  data.actions.processJobActive = false
}

const confirmDeleteProcessedData = deletingItem => {
  processedData.value = deletingItem
  deleteProcessedDataDialog.value = true
}

const deleteProcessedData = async () => {
  const result = await deleteOne(processedData.value.summary.id)

  if (result.success) {
    processedDataArray.value = processedDataArray.value.filter(
      val => val.summary.id !== processedData.value.summary.id,
    )
  }

  deleteProcessedDataDialog.value = false
  processedData.value = {}

  MainUtil.showToast(
    toast,
    result.success ? 'success' : 'error',
    result.message,
  )
}

const onSort = event => {
  console.log(event)
  console.log('onSort called')
  multiSortMeta.value = [
    {
      field: event.sortField,
      order: event.sortOrder,
    },
  ]
  fetchItems()
}

const transformSortField = field => {
  if (!field) return null

  // summary. ile başlayan field'ları dönüştür
  if (field.startsWith('summary.')) {
    return field.replace('summary.', '')
  }
  return field
}

const onPageChange = async event => {
  console.log('onPageChange called')
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
  filters.value.companies = drawerFilters.value.companies
  filters.value.titles = drawerFilters.value.titles
  filters.value.schools = drawerFilters.value.schools
  filters.value.departments = drawerFilters.value.departments
}

const setFilters = () => {
  drawerFilters.value.fullName = filters.value.fullName
  drawerFilters.value.status = filters.value.status
  drawerFilters.value.crawlDate = filters.value.crawlDate
  drawerFilters.value.processDate = filters.value.processDate
  drawerFilters.value.companies = filters.value.companies
  drawerFilters.value.titles = filters.value.titles
  drawerFilters.value.schools = filters.value.schools
  drawerFilters.value.departments = filters.value.departments
}

const checkHasFilter = () => {
  filters.value.hasFilter =
    filters.value.fullName.length > 0 ||
    filters.value.crawlDate !== null ||
    filters.value.processDate !== null ||
    filters.value.companies.length > 0 ||
    filters.value.titles.length > 0 ||
    filters.value.schools.length > 0 ||
    filters.value.departments.length > 0
}

const clearFilters = () => {
  visible.value = false
  currentPage.value = 0
  filters.value.hasFilter = false
  filters.value.fullName = []
  filters.value.status = null
  filters.value.crawlDate = null
  filters.value.processDate = null
  filters.value.companies = []
  filters.value.titles = []
  filters.value.schools = []
  filters.value.departments = []

  filters.value.hasFilter = false
  fetchItems()
}

const removeFilter = value => {
  if (
    filters.value.crawlDate &&
    formatDates(filters.value.crawlDate) === value
  ) {
    filters.value.crawlDate = null
  } else if (
    filters.value.processDate &&
    formatDates(filters.value.processDate) === value
  ) {
    filters.value.processDate = null
  } else if (filters.value.fullName.includes(value)) {
    filters.value.fullName = filters.value.fullName.filter(
      name => name !== value,
    )
  } else if (filters.value.companies.includes(value)) {
    filters.value.companies = filters.value.companies.filter(
      company => company !== value,
    )
  } else if (filters.value.titles.includes(value)) {
    filters.value.titles = filters.value.titles.filter(title => title !== value)
  } else if (filters.value.schools.includes(value)) {
    filters.value.schools = filters.value.schools.filter(
      school => school !== value,
    )
  } else if (filters.value.departments.includes(value)) {
    filters.value.departments = filters.value.departments.filter(
      department => department !== value,
    )
  }

  // Filtre durumunu kontrol et
  checkHasFilter()
  currentPage.value = 0
  fetchItems()
}

const showFilters = () => {
  setFilters()
  visible.value = true
}

//Crawl job methods
const startStop = async data => {
  console.log(data.actions.crawlJobActive)
  if (!data.actions.crawlJobActive) {
    const result = await start(data.summary.profileId)
    if (result.success) {
      data.actions.crawlJobActive = true
      startPolling(data.summary.id, data.summary.profileId)
    } else {
      MainUtil.showToast(
        toast,
        'error',
        'Beklenmeyen bir hata oluştu, crawling işlemi başlatılamadı',
      )
    }
  } else if (data.actions.crawlJobActive) {
    const result = stop(data.summary.profileId)
    if (result.success) {
      data.actions.crawlJobActive = false
      stopPolling(data.summary.id)
    } else {
      MainUtil.showToast(
        toast,
        'error',
        'Beklenmeyen bir hata oluştu, crawling işlemi durduralamadı',
      )
    }
  }
}

const findIndexById = id => {
  return processedDataArray.value.findIndex(item => item.summary.id === id)
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
      console.log(index)
      processedDataArray.value[index].actions.crawlJobActive = false
      console.log(processedDataArray.value[index])
      clearInterval(pollingIntervals.value[id])
      pollingIntervals.value[id] = null
      const fetchResult = await fetchDetail(null, profileId)
      if (fetchResult.success) {
        console.log(fetchResult.response.data)
        processedDataArray.value[index].summary.lastCrawlDate =
          fetchResult.response.data.crawlDate
        processedDataArray.value[index].summary.processDate =
          fetchResult.response.data.lastModifiedDate
        console.log('--------------------------------')
        console.log(fetchResult.response.data.crawlDate)
        console.log(fetchResult.response.data.lastModifiedDate)
        console.log(processedDataArray.value[index].summary.lastCrawlDate)
        console.log(processedDataArray.value[index].summary.processDate)
        console.log(processedDataArray.value[index])

        console.log('--------------------------------')

        MainUtil.showToast(
          toast,
          'success',
          fetchResult.response.data.fullName +
            ' için Crawling işlemi tamamlandı',
        )
      }
    }
  } else {
    console.log('işin durumu çekilemedi')
  }
}
</script>

<template>
  <div class="card flex justify-center gap-2" v-if="computedFilters.hasFilter">
    <template v-for="value in computedFilters.fullName" :key="'name-' + value">
      <Chip :label="value" removable @remove="removeFilter(value)" />
    </template>

    <Chip
      v-if="computedFilters.crawlDate"
      :key="'crawlDate'"
      :label="formatDates(computedFilters.crawlDate)"
      removable
      @remove="removeFilter(formatDates(computedFilters.crawlDate))"
    />

    <Chip
      v-if="computedFilters.processDate"
      :key="'processDate'"
      :label="formatDates(computedFilters.processDate)"
      removable
      @remove="removeFilter(formatDates(computedFilters.processDate))"
    />

    <template
      v-for="value in computedFilters.companies"
      :key="'company-' + value"
    >
      <Chip :label="value" removable @remove="removeFilter(value)" />
    </template>

    <template v-for="value in computedFilters.titles" :key="'title-' + value">
      <Chip :label="value" removable @remove="removeFilter(value)" />
    </template>

    <template v-for="value in computedFilters.schools" :key="'school-' + value">
      <Chip :label="value" removable @remove="removeFilter(value)" />
    </template>

    <template
      v-for="value in computedFilters.departments"
      :key="'department-' + value"
    >
      <Chip :label="value" removable @remove="removeFilter(value)" />
    </template>
  </div>
  <div class="card">
    <DataTable
      ref="dt"
      v-model:selection="selectedProcessedDatas"
      :value="processedDataArray"
      dataKey="summary.id"
      :paginator="true"
      :rows="10"
      :totalRecords="totalRecords"
      :loading="loading"
      :currentPage="currentPage"
      :lazy="true"
      :multiSortMeta="multiSortMeta"
      removableSort
      @sort="onSort($event)"
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
                <label class="w-full mb-2" for="status">Crawl Tarihi</label>
                <DatePicker
                  class="w-full"
                  v-model="drawerFilters.crawlDate"
                  selectionMode="range"
                  :manualInput="false"
                />
              </div>
              <div class="grid mt-4">
                <label class="w-full mb-2">İşlenme Tarihi</label>
                <DatePicker
                  class="w-full"
                  v-model="drawerFilters.processDate"
                  selectionMode="range"
                  :manualInput="false"
                />
              </div>
              <div class="grid mt-4">
                <Fieldset legend="Deneyime göre filtreleme" class="w-full">
                  <label class="w-full mt-2" for="companies">Şirketler</label>
                  <AutoComplete
                    v-model="drawerFilters.companies"
                    inputId="companies"
                    multiple
                    fluid
                    :typeahead="false"
                    variant="filled"
                    class="w-full mb-2 mt-2"
                  />
                  <label class="w-full mt-2" for="titles">Ünvanlar</label>
                  <AutoComplete
                    v-model="drawerFilters.titles"
                    inputId="titles"
                    multiple
                    fluid
                    :typeahead="false"
                    variant="filled"
                    class="w-full mb-2 mt-2"
                  />
                </Fieldset>
              </div>
              <div class="grid mt-4">
                <Fieldset legend="Eğtime göre filtreleme" class="w-full">
                  <label class="w-full mt-2" for="companies">Okullar</label>
                  <AutoComplete
                    v-model="drawerFilters.schools"
                    inputId="schools"
                    multiple
                    fluid
                    :typeahead="false"
                    variant="filled"
                    class="w-full mb-2 mt-2"
                  />
                  <label class="w-full mt-2" for="titles">Bölümler</label>
                  <AutoComplete
                    v-model="drawerFilters.departments"
                    inputId="departments"
                    multiple
                    fluid
                    :typeahead="false"
                    variant="filled"
                    class="w-full mb-2 mt-2"
                  />
                </Fieldset>
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
          <h2 class="m-0">İşlenmiş Profil Listesi</h2>
          <div>
            <Button
              label="Sil"
              icon="pi pi-trash"
              severity="danger"
              @click="confirmDeleteSelected"
              :disabled="!selectedProcessedDatas.length"
            />
          </div>
        </div>
      </template>

      <Column
        selectionMode="multiple"
        style="width: 3rem"
        :exportable="false"
      />
      <Column
        field="summary.fullName"
        header="Adı Soyadı"
        class="i-column"
        sortable
      />
      <Column
        field="summary.crawlDate"
        header="Son Crawl Tarihi"
        class="i-column"
        sortable
      />
      <Column
        field="summary.processDate"
        header="İşlenme Tarihi"
        class="i-column"
        sortable
      />
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
            @click="confirmDeleteProcessedData(data)"
          />

          <Button
            icon="pi pi-eye"
            severity="warn"
            class="mr-2"
            text
            raised
            rounded
            @click="showDetail(data)"
          />
        </template>
      </Column>
    </DataTable>
    <Toast position="bottom-right" />

    <Dialog
      v-model:visible="deleteProductsDialog"
      :style="{ width: '450px' }"
      header="Silme işlemi onayı"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span v-if="processedData"
          >Seçilen kayıtlar silinecektir, onaylıyor musunuz?</span
        >
      </div>
      <template #footer>
        <Button
          label="Hayır"
          icon="pi pi-times"
          text
          @click="deleteProductsDialog = false"
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
      v-model:visible="detailDialog"
      :style="{ width: '550px' }"
      header="Profil Detay"
      :modal="true"
      maximizable
    >
      <div class="flex flex-column">
        <div class="flex flex-row flex-wrap column-gap-4">
          <div class="flex align-items-center justify-content-center">
            <Image
              :src="processedData.profilePictureUrl"
              alt="Image"
              width="150"
            />
          </div>
          <div
            class="flex flex-column flex-wrap flex align-self-start justify-content-center"
          >
            <h2 class="p-1 m-0">{{ processedData.fullName }}</h2>
            <h5 class="p-1 m-0">{{ processedData.headline }}</h5>
            <h5 class="p-1 m-0">{{ processedData.location }}</h5>
            <h5 class="p-1 m-0">
              Bağlantı sayısı: {{ processedData.connectionCount }}
            </h5>
          </div>
        </div>
        <div class="flex-grow-1">
          <Accordion
            :value="[
              '0',
              '1',
              '2',
              '3',
              '4',
              '5',
              '6',
              '7',
              '8',
              '9',
              'languages',
              '10',
            ]"
            multiple
          >
            <AccordionPanel value="0">
              <AccordionHeader
                ><h3 class="accordionHeader">Hakkında</h3></AccordionHeader
              >
              <AccordionContent>
                <p class="p-0 m-0">
                  {{ processedData.about }}
                </p>
              </AccordionContent>
            </AccordionPanel>
            <AccordionPanel value="1">
              <AccordionHeader
                ><h3 class="accordionHeader">
                  İletişim Bilgileri
                </h3></AccordionHeader
              >
              <div v-if="processedData.contactInfo">
                <AccordionContent>
                  <div>
                    Telefon:
                    <ul>
                      <li v-for="value in processedData.contactInfo.phones">
                        {{ value }}
                      </li>
                    </ul>
                  </div>
                  <div>
                    Email:
                    <ul>
                      <li v-for="value in processedData.contactInfo.emails">
                        {{ value }}
                      </li>
                    </ul>
                  </div>
                  <div>
                    Websiteleri:
                    <ul>
                      <li v-for="value in processedData.contactInfo.websites">
                        <a :href="value" target="_blank">{{ value }}</a>
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </div>
              <p class="detailSubContent" v-else>-</p>
            </AccordionPanel>
            <AccordionPanel value="2">
              <AccordionHeader
                ><h3 class="accordionHeader">Deneyimler</h3></AccordionHeader
              >
              <AccordionContent>
                <div v-if="processedData.experiences">
                  <div v-for="value in processedData.experiences">
                    <h4 class="detailMainContent">{{ value.title }}</h4>
                    <p class="detailSubContent">{{ value.company }}</p>
                    <p class="detailSubContent">{{ value.duration }}</p>
                    <p class="detailSubContent">{{ value.location }}</p>
                    <p class="detailSubContent">{{ value.description }}</p>
                  </div>
                </div>
                <p class="detailSubContent" v-else>-</p>
              </AccordionContent>
            </AccordionPanel>
            <AccordionPanel value="3">
              <AccordionHeader
                ><h3 class="accordionHeader">Eğitimler</h3></AccordionHeader
              >
              <AccordionContent>
                <div v-if="processedData.educations">
                  <div v-for="value in processedData.educations">
                    <h4 class="detailMainContent">{{ value.schoolName }}</h4>
                    <p class="detailSubContent">{{ value.department }}</p>
                    <p class="detailSubContent">{{ value.duration }}</p>
                    <p class="detailSubContent">{{ value.description }}</p>
                  </div>
                </div>
                <p class="detailSubContent" v-else>-</p>
              </AccordionContent>
            </AccordionPanel>
            <AccordionPanel value="languages">
              <AccordionHeader
                ><h3 class="accordionHeader">
                  Yabancı Diller
                </h3></AccordionHeader
              >
              <AccordionContent>
                <div v-if="processedData.languages">
                  <div v-for="value in processedData.languages">
                    <h4 class="detailMainContent">{{ value.name }}</h4>
                    <p class="detailSubContent">{{ value.info }}</p>
                  </div>
                </div>
                <p class="detailSubContent" v-else>-</p>
              </AccordionContent>
            </AccordionPanel>
            <AccordionPanel value="4">
              <AccordionHeader
                ><h3 class="accordionHeader">Sertifikalar</h3></AccordionHeader
              >
              <AccordionContent>
                <div v-if="processedData.certifications">
                  <div v-for="value in processedData.certifications">
                    <h4 class="detailMainContent">{{ value.name }}</h4>
                    <p class="detailSubContent">{{ value.issuer }}</p>
                    <p class="detailSubContent">{{ value.duration }}</p>
                    <p class="detailSubContent">{{ value.description }}</p>
                  </div>
                </div>
                <p class="detailSubContent" v-else>-</p>
              </AccordionContent>
            </AccordionPanel>
            <AccordionPanel value="5">
              <AccordionHeader
                ><h3 class="accordionHeader">Yetenekler</h3></AccordionHeader
              >
              <AccordionContent>
                <div v-for="value in processedData.skills">
                  <h4 class="detailMainContent">{{ value.name }}</h4>
                  <p class="detailSubContent">{{ value.organisation }}</p>
                  <p class="detailSubContent">{{ value.approveCount }}</p>
                </div>
              </AccordionContent>
            </AccordionPanel>
            <AccordionPanel value="6">
              <AccordionHeader
                ><h3 class="accordionHeader">Referanslar</h3></AccordionHeader
              >
              <AccordionContent>
                <div v-if="processedData.references">
                  <div v-for="value in processedData.references">
                    <!--TODO-->
                  </div>
                </div>
                <p class="detailSubContent" v-else>-</p>
              </AccordionContent>
            </AccordionPanel>
            <AccordionPanel value="7">
              <AccordionHeader
                ><h3 class="accordionHeader">
                  Ödüller ve Başarılar
                </h3></AccordionHeader
              >
              <AccordionContent>
                <div v-if="processedData.awards">
                  <div v-for="value in processedData.awards">
                    <h4 class="detailMainContent">{{ value.name }}</h4>
                    <p class="detailSubContent">{{ value.info }}</p>
                  </div>
                </div>
                <p class="detailSubContent" v-else>-</p>
              </AccordionContent>
            </AccordionPanel>
            <AccordionPanel value="8">
              <AccordionHeader
                ><h3 class="accordionHeader">Projeler</h3></AccordionHeader
              >
              <AccordionContent>
                <div v-if="processedData.projects">
                  <div v-for="value in processedData.projects">
                    <!--TODO-->
                  </div>
                </div>
                <p class="detailSubContent" v-else>-</p>
              </AccordionContent>
            </AccordionPanel>
            <AccordionPanel value="9">
              <AccordionHeader
                ><h3 class="accordionHeader">İlgi Alanları</h3></AccordionHeader
              >
              <AccordionContent>
                <div v-if="processedData.interests">
                  <div v-for="value in processedData.interests">
                    <!--TODO-->
                  </div>
                </div>
                <p class="detailSubContent" v-else>-</p>
              </AccordionContent>
            </AccordionPanel>
            <AccordionPanel value="10">
              <AccordionHeader
                ><h3 class="accordionHeader">
                  Gönüllü Çalışmalar
                </h3></AccordionHeader
              >
              <AccordionContent>
                <div v-if="processedData.volunteerings">
                  <div v-for="value in processedData.volunteerings">
                    <h4 class="detailMainContent">{{ value.name }}</h4>
                    <p class="detailSubContent">{{ value.organisation }}</p>
                    <p class="detailSubContent">{{ value.duration }}</p>
                    <p class="detailSubContent">{{ value.description }}</p>
                  </div>
                </div>
                <p class="detailSubContent" v-else>-</p>
              </AccordionContent>
            </AccordionPanel>
          </Accordion>
        </div>
      </div>
      <template #footer>
        <Button label="Yazdır" icon="pi pi-print" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteProcessedDataDialog"
      :style="{ width: '450px' }"
      header="Silme işlemi onayı"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" severity="danger" />
        <span v-if="processedData"
          >İlgili kaydı silmeyi onaylıyor musunuz? Profilin Adı Soyadı:
          <b>{{ processedData.summary.fullName }}</b></span
        >
      </div>
      <template #footer>
        <Button
          label="Hayır"
          icon="pi pi-times"
          text
          @click="deleteProcessedDataDialog = false"
        />
        <Button label="Evet" icon="pi pi-check" @click="deleteProcessedData" />
      </template>
    </Dialog>
  </div>
</template>

<style>
.accordionHeader {
  margin: 0;
  padding: 0;
}
.detailMainContent {
  margin-top: 5px;
  margin-bottom: 0;
  margin-left: 0;
  margin-right: 0;
  padding: 0;
  /*border-top: 1px dotted black;*/
}
.detailSubContent {
  margin-top: 0;
  margin-bottom: 0;
  margin-left: 20px;
  margin-right: 0;
  padding: 0;
}
</style>

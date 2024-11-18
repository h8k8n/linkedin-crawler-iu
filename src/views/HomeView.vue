<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  FilterMatchMode,
  FilterOperator,
  FilterService,
} from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'

// Bileşenlerin import edilmesi
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
//import Textarea from "primevue/textarea";
//import InputNumber from "primevue/inputnumber";
import InputIcon from 'primevue/inputicon'
import IconField from 'primevue/iconfield'
import Select from 'primevue/select'
import FloatLabel from 'primevue/floatlabel'
import Checkbox from 'primevue/checkbox'
import Toast from 'primevue/toast'
import AutoComplete from 'primevue/autocomplete'
import { useCrawlerService } from '@/services/CrawlerService'
import { MainUtil } from '@/util/MainUtil'

const toast = useToast()
const dt = ref()
const crawlers = ref([])
const crawlerDialog = ref(false)
const deleteItemDialog = ref(false)
const deleteItemsDialog = ref(false)
const crawlerDetailDialog = ref(false)
const crawler = ref({})
const selectedCrawlers = ref([])
const submitted = ref(false)
const disableRecursiveDepth = ref(true)
const pollingIntervals = ref([])
//const crawlerFilters = ref([]);
const {
  fetchFilterDefinitions,
  deleteOne,
  deleteBatch,
  fetchAll,
  fetchDetail,
  create,
  update,
  start,
  status,
  stop,
} = useCrawlerService()

const filterDefinitions = ref({})

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: {
    value: null,
    matchMode: FilterMatchMode.EQUALS,
  },
  status: { value: null, matchMode: FilterMatchMode.IN },
  type: {
    constraints: [
      {
        value: null,
        matchMode: 'filterByArrayEquals',
      },
    ],
  },
})

const crawlerTypes = ref([
  { label: 'Kişi', value: 'PERSON' },
  { label: 'Şirket', value: 'COMPANY' },
  { label: 'Okul', value: 'SCHOOL' },
  { label: 'Grup', value: 'GROUP' },
])

const formatType = data => {
  console.log('formatType:' + data.type)
  var typeName = ''
  crawlerTypes.value.forEach(element => {
    if (data.type === element.value) {
      typeName = element.label
    }
  })
  if (data.recursiveEnable === true) {
    return 'İlgili Profiller Modu (' + typeName + ')'
  } else if (data.type === 'PERSON') {
    return 'Tek Profil Modu (' + typeName + ')'
  } else {
    return 'Kuruluş Modu (' + typeName + ')'
  }
}

/*const setFilterPaymentStatus = value => {
  console.log(
    JSON.stringify(value) + ' - ' + JSON.stringify(filters.value.type),
  )
  filters.value.type.value = value
}*/

const formatStatus = data => {
  console.log(data.status)
  switch (data.status) {
    case 0:
      return 'Başlatmaya Hazır'
    case 1:
      return 'Devam Ediyor'
    case 2:
      return 'Durduruldu'
    case 3:
      return 'Tamamlandı'
    default:
      return 'Bilinmiyor'
  }
}

/*const initFilters = () => {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: {
      value: null,
      matchMode: FilterMatchMode.EQUALS,
    },
    type: {
      value: null,
      matchMode: FilterMatchMode.EQUALS,
    },
    status: { value: null, matchMode: FilterMatchMode.IN },
  }
}

initFilters()*/

const checked = event => {
  console.log(event.srcElement.checked)

  disableRecursiveDepth.value = !event.srcElement.checked
}

//const categories = ref(["Accessories", "Clothing", "Electronics", "Fitness"]);

// API'den ürünleri yükle
onMounted(async () => {
  try {
    const resultFetchAll = await fetchAll()
    if (resultFetchAll.success) {
      crawlers.value = resultFetchAll.response.data
    } else {
      MainUtil.showToast(
        toast,
        resultFetchAll.success ? 'success' : 'error',
        resultFetchAll.message,
      )
    }

    crawlers.value.map(item => {
      console.log('id: ' + item.id + ' - status: ' + item.status)
      if (item.status === 1) startPolling(item.id)
      else pollingIntervals[item.id] = null
    })
    const result = await fetchFilterDefinitions()
    if (result.success) {
      filterDefinitions.value = result.response.data
    } else {
      MainUtil.showToast(
        toast,
        result.success ? 'success' : 'error',
        result.message,
      )
    }
  } catch (error) {
    console.error('Veriler çekilirken hata oluştu:', error)
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Veriler çekilirken hata oluştu',
      life: 3000,
    })
  }
})

const openNew = () => {
  crawler.value = { crawlingFilters: {} }
  submitted.value = false
  crawlerDialog.value = true
}

const hideDialog = () => {
  crawlerDialog.value = false
  submitted.value = false
}

const saveProduct = async () => {
  submitted.value = true

  if (crawler.value.description?.trim()) {
    var result
    if (crawler.value.id) {
      crawler.value.type = crawler.value.type.value
      result = await update(crawler.value)
      if (result.success) {
        crawlers.value[findIndexById(result.response.data.crawlingDto.id)] =
          result.response.data.crawlingDto
      }
    } else {
      crawler.value.type = crawler.value.type.value
      result = await create(crawler.value)
      if (result.success) {
        console.log('---------------------------')
        console.log(result.response.data)
        crawlers.value.push(result.response.data.crawlingDto)
      }
    }
    MainUtil.showToast(
      toast,
      result.success ? 'success' : 'error',
      result.message,
    )
    crawlerDialog.value = false
    crawler.value = {}
  }
}

const editProduct = editingProduct => {
  crawler.value = { ...editingProduct }
  crawlerTypes.value.forEach(element => {
    if (crawler.value.type === element.value) {
      crawler.value.type = element
    }
  })
  crawlerDialog.value = true
}

const showCrawler = selectedCrawler => {
  crawler.value = { ...selectedCrawler }
  crawlerTypes.value.forEach(element => {
    if (crawler.value.type === element.value) {
      crawler.value.type = element
    }
  })
  crawlerDetailDialog.value = true
}

const startStop = async slotProps => {
  if (slotProps.data.status != 1) {
    const result = await start(slotProps.data.id)
    if (result.success) {
      slotProps.data.status = 1
      startPolling(slotProps.data.id)
    } else {
      MainUtil.showToast(toast, 'error', result.error)
    }
  } else if (slotProps.data.status === 1) {
    const result = await stop(slotProps.data.id)
    if (result.success) {
      slotProps.data.status = 2
      stopPolling(slotProps.data.id)
    } else {
      MainUtil.showToast(
        toast,
        'error',
        'Beklenmeyen bir hata oluştu, crawling işlemi durduralamadı',
      )
    }
  }
}

const startPolling = id => {
  console.log('startPolling: ' + id)
  pollingIntervals[id] = setInterval(async () => {
    await checkJobStatus(id)
  }, 1000)
}

const stopPolling = id => {
  if (pollingIntervals[id]) {
    clearInterval(pollingIntervals[id])
    pollingIntervals[id] = null
  }
}

const checkJobStatus = async id => {
  const result = await status(id)
  if (result.success) {
    var responseStatus = result.response.data
    if (responseStatus === 2 || responseStatus == 3) {
      crawlers.value[findIndexById(id)].status = responseStatus
      clearInterval(pollingIntervals[id])
      pollingIntervals[id] = null
    }
  } else {
    MainUtil.showToast(
      toast,
      'error',
      'Beklenmeyen bir hata oluştu, crawling işlemi başlatılamadı',
    )
  }
}

const confirmDeleteProduct = deletingItem => {
  crawler.value = deletingItem
  deleteItemDialog.value = true
}

const deleteItem = async () => {
  const result = await deleteOne(crawler.value.id)
  if (result.success) {
    crawlers.value = crawlers.value.filter(val => val.id !== crawler.value.id)
  }
  deleteItemDialog.value = false
  crawler.value = {}
  MainUtil.showToast(
    toast,
    result.success ? 'success' : 'error',
    result.message,
  )
}

const findIndexById = id => {
  return crawlers.value.findIndex(item => item.id === id)
}

const confirmDeleteSelected = () => {
  deleteItemsDialog.value = true
}

/*const formatFilter = (data) => {
  console.log(data);
  var filterType = data.filterType;
  if (data.filterType == "COUNTRY") {
    filterType = "ÜLKE";
  } else if (data.filterType == "SCHOOL") {
    filterType = "OKUL";
  }
  return filterType + ": " + data.filterValue;
};*/

/*const deleteSelected = () => {
  var selectedIds = selectedCrawlers.value.map(data => data.id)
  //  console.log(selectedIds)
  axios
    .post('http://localhost:8082/api/crawling/delete/v1', selectedIds)
    .then(() => {
      crawlers.value = crawlers.value.filter(
        val => !selectedCrawlers.value.includes(val),
      )
      deleteItemsDialog.value = false
      selectedCrawlers.value = []
      toast.add({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Seçili Ürünler Silindi',
        life: 3000,
      })
    })
    .catch(err => {
      console.error(err)
    })
}*/

const deleteSelected = async () => {
  var selectedIds = selectedCrawlers.value.map(data => data.id)
  const result = await deleteBatch(selectedIds)
  if (result.success) {
    crawlers.value = crawlers.value.filter(
      val => !selectedCrawlers.value.includes(val),
    )
  }
  deleteItemsDialog.value = false
  selectedCrawlers.value = []
  MainUtil.showToast(
    toast,
    result.success ? 'success' : 'error',
    result.message,
  )
}
</script>
<template>
  <div class="card">
    <DataTable
      ref="dt"
      v-model:selection="selectedCrawlers"
      :value="crawlers"
      dataKey="id"
      :paginator="true"
      :rows="10"
      :filters="filters"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[5, 10, 25]"
      currentPageReportTemplate="{first} - {last} / {totalRecords} crawlers"
      filterDisplay="menu"
      :globalFilterFields="['description', 'type', 'status']"
    >
      <template #header>
        <div class="flex justify-content-between flex-wrap">
          <div>
            <Button
              label="Yeni"
              icon="pi pi-plus"
              class="mr-2"
              @click="openNew"
            />
            <Button
              label="Sil"
              icon="pi pi-trash"
              severity="danger"
              @click="confirmDeleteSelected"
              :disabled="!selectedCrawlers.length"
            />
          </div>
          <h2 class="m-0">Crawler Yönetimi</h2>
          <IconField>
            <InputIcon>
              <i class="pi pi-search" />
            </InputIcon>
            <InputText
              v-model="filters['global'].value"
              placeholder="Arama..."
            />
          </IconField>
        </div>
      </template>

      <Column
        selectionMode="multiple"
        style="width: 3rem"
        :exportable="false"
      />
      <Column field="description" header="Tanım" sortable class="i-column" />
      <Column
        field="type"
        header="Modu"
        filterField="type"
        :showFilterMatchModes="false"
        :filterMenuStyle="{ width: '14rem' }"
        sortable
        class="i-column"
      >
        <template #body="slotProps">
          {{ formatType(slotProps.data) }}
        </template>
      </Column>
      <Column field="status" header="Durumu" class="i-column">
        <template #body="slotProps">
          {{ formatStatus(slotProps.data) }}
        </template>
      </Column>
      <Column :exportable="false" class="i-column">
        <template #body="slotProps">
          <Button
            icon="pi pi-pencil"
            class="mr-2"
            text
            raised
            rounded
            @click="editProduct(slotProps.data)"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            class="mr-2"
            text
            raised
            rounded
            @click="confirmDeleteProduct(slotProps.data)"
          />
          <Button
            icon="pi pi-eye"
            severity="warn"
            class="mr-2"
            text
            raised
            rounded
            @click="showCrawler(slotProps.data)"
          />

          <Button
            id="startStopBtn"
            class="mr-2"
            severity="info"
            text
            raised
            rounded
            @click="startStop(slotProps)"
          >
            <span v-if="slotProps.data.status === 1" class="pi pi-stop"></span>
            <span v-else class="pi pi-play"></span>
          </Button>
        </template>
      </Column>
    </DataTable>

    <Toast position="bottom-right" />

    <Dialog
      v-model:visible="crawlerDialog"
      :style="{ width: '550px' }"
      header="Crawler Bilgisi"
      :modal="true"
    >
      <div class="w-full">
        <div class="field grid">
          <label class="col-3" for="description"> Tanım </label>
          <div class="col-9">
            <InputText
              id="description"
              v-model.trim="crawler.description"
              required="true"
              autofocus
              :invalid="submitted && !crawler.description"
              fluid
            />
          </div>
        </div>
        <div class="field grid">
          <label for="type" class="col-3">Tipi</label>
          <div class="col-9">
            <Select
              id="type"
              v-model="crawler.type"
              :options="crawlerTypes"
              optionLabel="label"
              placeholder="Tip seçiniz"
              fluid
            ></Select>
          </div>
        </div>
        <div class="field grid">
          <label for="target" class="col-3">Hedefi</label>
          <div class="col-9">
            <InputText
              id="target"
              v-model.trim="crawler.target"
              required="true"
              autofocus
              :invalid="submitted && !crawler.description"
              fluid
            />
          </div>
        </div>
        <div class="field grid">
          <div class="col-3">
            <label for="threadCount">Thread Sayısı</label>
          </div>
          <div class="col-9">
            <InputText
              id="threadCount"
              v-model.trim="crawler.threadCount"
              required="true"
              fluid
            />
          </div>
        </div>
        <div class="field grid">
          <div class="col-6 i-checkbox-container">
            <Checkbox
              v-model="crawler.recursiveEnable"
              inputId="recursiveEnable"
              name="crawler"
              :binary="true"
              @change="checked($event)"
            />
            <label for="recursiveEnable" class="ml-2">
              Benzer profilere Bakılsın
            </label>
          </div>
          <div class="col-6">
            <FloatLabel variant="on">
              <InputText
                id="recursiveDepth"
                v-model="crawler.recursiveDepth"
                :disabled="disableRecursiveDepth"
                fluid
              />
              <label for="recursiveDepth">Derinlik</label>
            </FloatLabel>
          </div>
        </div>
        <div class="field grid">
          <div class="col-12">
            <h2 class="flex justify-content-center flex-wrap">Filtreler</h2>
          </div>
        </div>
        <div class="field grid" v-for="value in filterDefinitions">
          <div class="col-3">
            <label :for="value.key">{{ value.label }}</label>
          </div>
          <div class="col-9" v-if="value.values">
            <div v-for="subValue in value.values">
              <div class="flex items-center gap-2">
                <Checkbox
                  v-model="crawler.crawlingFilters[value.key]"
                  :inputId="subValue"
                  :name="subValue"
                  :value="subValue"
                  fluid
                />
                <label :for="subValue"> {{ subValue }} </label>
              </div>
            </div>
          </div>
          <div class="col-9" v-else>
            <AutoComplete
              v-model="crawler.crawlingFilters[value.key]"
              :inputId="value.key"
              multiple
              fluid
              :typeahead="false"
              variant="filled"
              class="flex"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="İptal" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Kaydet" icon="pi pi-check" @click="saveProduct" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="crawlerDetailDialog"
      :style="{ width: '550px' }"
      header="Detaylar"
      :modal="true"
    >
      <div class="w-full">
        <div class="grid">
          <label class="col-3" for="description"> Tanım </label>
          <div class="col-9">
            <InputText
              id="description"
              v-model.trim="crawler.description"
              fluid
              disabled
              class="disabled-input-text"
            />
          </div>
        </div>
        <div class="grid">
          <label for="type" class="col-3">Tipi</label>
          <div class="col-9">
            <Select
              id="type"
              v-model="crawler.type"
              :options="crawlerTypes"
              optionLabel="label"
              fluid
              disabled
              class="disabled-input-text"
            ></Select>
          </div>
        </div>
        <div class="grid">
          <label class="col-3" for="target"> Hedefi </label>
          <div class="col-9">
            <InputText
              id="target"
              v-model.trim="crawler.target"
              fluid
              disabled
              class="disabled-input-text"
            />
          </div>
        </div>
        <div class="grid">
          <div class="col-3">
            <label for="threadCount">Thread Sayısı</label>
          </div>
          <div class="col-9">
            <InputText
              id="threadCount"
              v-model.trim="crawler.threadCount"
              fluid
              disabled
              class="disabled-input-text"
            />
          </div>
        </div>
        <div class="grid">
          <div class="col-6 i-checkbox-container">
            <Checkbox
              v-model="crawler.recursiveEnable"
              inputId="recursiveEnable"
              name="crawler"
              :binary="true"
              disabled
              fluid
            />
            <label for="recursiveEnable" class="ml-2">
              Benzer profilere Bakılsın
            </label>
          </div>
          <div class="col-6">
            <FloatLabel variant="on">
              <InputText
                id="recursiveDepth"
                v-model="crawler.recursiveDepth"
                disabled
                fluid
                class="disabled-input-text"
              />
              <label for="recursiveDepth">Recursive Depth</label>
            </FloatLabel>
          </div>
        </div>
        <div class="grid">
          <div class="col-12">
            <h2 class="flex justify-content-center flex-wrap">Filtreler</h2>
          </div>
        </div>

        <div class="grid" v-for="value in filterDefinitions">
          <div class="col-3">
            <label :for="value.key">{{ value.label }}</label>
          </div>
          <div class="col-9">
            <InputText
              :id="value.key"
              v-model="crawler.crawlingFilters[value.key]"
              fluid
              disabled
              class="disabled-input-text"
            />
          </div>
        </div>
        <div class="grid">
          <div class="col-12">
            <h2 class="flex justify-content-center flex-wrap">
              İşlem Bilgileri
            </h2>
          </div>
        </div>
        <div class="grid">
          <div class="col-3">
            <label for="department">Oluşturan</label>
          </div>
          <div class="col-5">
            <InputText
              id="department"
              v-model="crawler.createdBy"
              fluid
              disabled
              class="disabled-input-text"
            />
          </div>
          <div class="col-4">
            <InputText
              id="department"
              v-model="crawler.createdDate"
              fluid
              disabled
              class="disabled-input-text"
            />
          </div>
        </div>
        <div class="grid">
          <div class="col-3">
            <label for="department">Son Güncelleyen</label>
          </div>
          <div class="col-5">
            <InputText
              id="department"
              v-model="crawler.lastModifiedBy"
              fluid
              disabled
              class="disabled-input-text"
            />
          </div>
          <div class="col-4">
            <InputText
              id="department"
              v-model="crawler.lastModifiedDate"
              fluid
              disabled
              class="disabled-input-text"
            />
          </div>
        </div>
        <div class="grid">
          <div class="col-3">
            <label for="department">Son Çalıştıran</label>
          </div>
          <div class="col-5">
            <InputText
              id="department"
              v-model="crawler.createdBy"
              fluid
              disabled
              class="disabled-input-text"
            />
          </div>
          <div class="col-4">
            <InputText
              id="department"
              v-model="crawler.createdDate"
              fluid
              disabled
              class="disabled-input-text"
            />
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="deleteItemDialog"
      :style="{ width: '450px' }"
      header="Silme işlemi onayı"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" severity="danger" />
        <span v-if="crawler"
          >İlgili kaydı silmeyi onaylıyor musunuz? Tanım:
          <b>{{ crawler.description }}</b></span
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

    <Dialog
      v-model:visible="deleteItemsDialog"
      :style="{ width: '450px' }"
      header="Silme işlemi onayı"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span v-if="crawler"
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
        <Button label="Evet" icon="pi pi-check" text @click="deleteSelected" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.disabled-input-text {
  border: 1px solid #adadb1;
}
.i-checkbox-container {
  margin-top: 8px;
}
.i-column {
  min-width: 500px;
}
</style>
